import Foundation

/// Port of the original `runtime/animation_model.py` — a pure animation state
/// machine with no UI dependency. Keeps durable DSH state separate from
/// temporary visual overlays so a click, idle micro-animation, or success
/// pulse always returns to the newest Agent state.
final class AnimationModel {
    struct Clip {
        let name: String
        let frames: [String]
        let frameMs: Int
        let loop: Bool
    }

    static let states: Set<String> = [
        "IDLE", "THINKING", "WORKING", "WAITING", "SUCCESS", "ERROR", "DISCONNECTED",
    ]

    private static let dragClips: Set<String> = ["dragging", "dragging_release"]
    private static let interactionClips: Set<String> = ["head_pat", "poke", "tail"]

    /// Fade clip changes only; never blend successive 24 fps video frames.
    static func crossfadeDuration(previousClip: String, currentClip: String) -> Double? {
        if previousClip == currentClip || dragClips.contains(previousClip) || dragClips.contains(currentClip) {
            return nil
        }
        return 0.10
    }

    private(set) var clips: [String: Clip] = [:]
    private var stateMap: [String: String] = [:]
    private var workingActivityMap: [String: String] = [:]
    private(set) var idleMicroClips: [String] = []
    private var idleMicroIntervalsMs: [String: [Int]] = [:]
    /// Celebration pool. DSH turns finish often enough that one clip reads as a
    /// loop, so rotate through the variants instead of replaying `success`.
    private var successVariants: [String] = []
    private var successCursor = 0
    private var lastSuccessClip: String?
    private var interactionCooldownMs = 1200
    /// Per-body-part click responses and per-completion error reactions. Both
    /// pools rotate so a frequent click does not replay one clip forever.
    private var interactionVariants: [String: [String]] = [:]
    private var interactionCursors: [String: Int] = [:]
    private var lastInteractionClip: [String: String] = [:]
    private var interactionClipNames: Set<String> = ["head_pat", "poke", "tail"]
    private var errorVariants: [String] = []
    private var errorCursor = 0
    private var lastErrorClip: String?
    /// Sleep sequence: idle long enough, play `start`, hold `loop`, and play
    /// `end` when anything asks for attention again.
    private(set) var sleepStart: String?
    private(set) var sleepLoop: String?
    private(set) var sleepEnd: String?
    private(set) var sleepAfterMs = 600_000
    private(set) var isSleeping = false
    private var lastInteractionMs: Int?
    private var lastIdleMicro: String?

    private(set) var baseState = "IDLE"
    private(set) var baseActivity: String?
    private(set) var baseClipName = "idle"
    private(set) var overlayClipName: String?
    private(set) var pulseState: String?
    private(set) var pulseDeadlineMs: Int?
    private(set) var pulseClipName: String?
    private(set) var activeClipName = "idle"
    private(set) var frameIndex = 0
    private(set) var frameElapsedMs = 0

    init(manifest: [String: Any]) {
        if let clipsDict = manifest["clips"] as? [String: Any] {
            for (name, value) in clipsDict {
                guard let v = value as? [String: Any],
                      let frames = v["frames"] as? [String] else { continue }
                clips[name] = Clip(
                    name: name,
                    frames: frames,
                    frameMs: Self.asInt(v["frameMs"], fallback: 180),
                    loop: (v["loop"] as? Bool) ?? false
                )
            }
        }
        if let map = manifest["stateMap"] as? [String: String] { stateMap = map }
        if let map = manifest["workingActivityMap"] as? [String: String] { workingActivityMap = map }
        if let micros = manifest["idleMicroClips"] as? [String] { idleMicroClips = micros }
        if let variants = manifest["successVariants"] as? [String] {
            successVariants = variants.filter { clips[$0] != nil }
        }
        if let variants = manifest["errorVariants"] as? [String] {
            errorVariants = variants.filter { clips[$0] != nil }
        }
        if let variants = manifest["interactionVariants"] as? [String: [String]] {
            interactionVariants = variants.mapValues { $0.filter { clips[$0] != nil } }
            for pool in interactionVariants.values { interactionClipNames.formUnion(pool) }
        }
        if let sleep = manifest["sleep"] as? [String: Any] {
            sleepStart = sleep["start"] as? String
            sleepLoop = sleep["loop"] as? String
            sleepEnd = sleep["end"] as? String
            if let after = sleep["afterMs"] as? Int { sleepAfterMs = after }
        }
        idleMicroIntervalsMs = manifest["idleMicroIntervalsMs"] as? [String: [Int]] ?? [
            "quiet": [45000, 90000], "normal": [25000, 45000], "lively": [12000, 22000],
        ]
        interactionCooldownMs = Self.asInt(manifest["interactionCooldownMs"], fallback: 1200)
        if let idleClip = stateMap["IDLE"], !idleClip.isEmpty {
            baseClipName = idleClip
            activeClipName = idleClip
        }
    }

    var activeClip: Clip {
        clips[activeClipName] ?? Clip(name: activeClipName, frames: [], frameMs: 180, loop: false)
    }

    var frame: String {
        activeClip.frames.isEmpty ? "" : activeClip.frames[frameIndex]
    }

    var overlayRemainingMs: Int {
        guard overlayClipName != nil, !activeClip.loop else { return 0 }
        return (activeClip.frames.count - frameIndex) * activeClip.frameMs - frameElapsedMs
    }

    func idleMicroInterval(activityLevel: String) -> ClosedRange<Int> {
        let pair = idleMicroIntervalsMs[activityLevel] ?? idleMicroIntervalsMs["normal"] ?? [25000, 45000]
        return pair[0]...pair[1]
    }

    func applyState(_ state: String, activity: String? = nil) {
        guard Self.states.contains(state) else { return }
        let wasSuccess = baseState == "SUCCESS"
        let wasError = baseState == "ERROR"
        if isSleeping { wake() }
        baseState = state
        baseActivity = activity
        if state == "SUCCESS", !wasSuccess {
            baseClipName = nextSuccessClip()
        } else if state == "ERROR", !wasError {
            baseClipName = nextErrorClip()
        } else {
            baseClipName = clip(for: state, activity: activity)
        }
        if state != "IDLE" {
            pulseState = nil
            pulseDeadlineMs = nil
            pulseClipName = nil
            if !Self.dragClips.contains(overlayClipName ?? "") { overlayClipName = nil }
        }
        if overlayClipName == nil {
            activate(underlayClipName)
        }
    }

    func applyPulse(state: String, ttlMs: Int, nowMs: Int, resumeState: String?, resumeActivity: String?, completeClip: Bool = true) {
        guard Self.states.contains(state), ttlMs > 0 else { return }
        if let resume = resumeState, Self.states.contains(resume) {
            baseState = resume
            baseActivity = resumeActivity
            baseClipName = clip(for: resume, activity: resumeActivity)
        }
        let previousDeadline = pulseState == state ? pulseDeadlineMs : nil
        pulseState = state
        pulseClipName = clip(for: state, activity: nil)
        let pulseClip = clips[pulseClipName ?? ""]
        let duration = completeClip ? (pulseClip?.frames.count ?? 0) * (pulseClip?.frameMs ?? 0) : 0
        pulseDeadlineMs = max(nowMs + ttlMs, previousDeadline ?? nowMs + duration)
        if !Self.dragClips.contains(overlayClipName ?? "") { overlayClipName = nil }
        if overlayClipName == nil {
            activate(pulseClipName ?? baseClipName)
        }
    }

    @discardableResult
    func playOverlay(_ clipName: String) -> Bool {
        guard clips[clipName] != nil else { return false }
        overlayClipName = clipName
        activate(clipName)
        return true
    }

    func clearOverlay() {
        overlayClipName = nil
        activate(underlayClipName)
    }

    @discardableResult
    func playInteraction(_ clipName: String, nowMs: Int) -> Bool {
        guard interactionClipNames.contains(clipName), pulseState == nil else { return false }
        let current = overlayClipName ?? ""
        guard !interactionClipNames.contains(current), !Self.dragClips.contains(current) else { return false }
        if let last = lastInteractionMs, nowMs - last < interactionCooldownMs { return false }
        guard playOverlay(clipName) else { return false }
        lastInteractionMs = nowMs
        return true
    }

    @discardableResult
    func playIdleMicro(index: Int = 0) -> Bool {
        guard baseState == "IDLE", overlayClipName == nil, pulseState == nil else { return false }
        guard !idleMicroClips.isEmpty else { return false }
        var name = idleMicroClips[index % idleMicroClips.count]
        if idleMicroClips.count > 1, name == lastIdleMicro {
            name = idleMicroClips[(index + 1) % idleMicroClips.count]
        }
        lastIdleMicro = name
        return playOverlay(name)
    }

    func advance(elapsedMs: Int, nowMs: Int) {
        guard elapsedMs >= 0 else { return }
        var elapsed = elapsedMs
        if let deadline = pulseDeadlineMs, nowMs >= deadline {
            pulseState = nil
            pulseDeadlineMs = nil
            pulseClipName = nil
            if overlayClipName == nil {
                activate(baseClipName)
                elapsed = 0
            }
        }

        let clip = activeClip
        guard !clip.frames.isEmpty else { return }
        let total = frameElapsedMs + elapsed
        let nextFrame = frameIndex + total / clip.frameMs
        frameElapsedMs = total % clip.frameMs
        if nextFrame < clip.frames.count {
            frameIndex = nextFrame
        } else if clip.loop {
            frameIndex = nextFrame % clip.frames.count
        } else if overlayClipName != nil {
            let finished = overlayClipName
            overlayClipName = nil
            if isSleeping, finished == sleepStart, let loop = sleepLoop, clips[loop] != nil {
                _ = playOverlay(loop)
            } else {
                activate(underlayClipName)
            }
        } else {
            frameIndex = clip.frames.count - 1
            frameElapsedMs = 0
        }
    }

    /// Rotate the error pool, never repeating the clip just played.
    private func nextErrorClip() -> String {
        guard !errorVariants.isEmpty else { return clip(for: "ERROR", activity: nil) }
        var name = errorVariants[errorCursor % errorVariants.count]
        errorCursor += 1
        if errorVariants.count > 1, name == lastErrorClip {
            name = errorVariants[errorCursor % errorVariants.count]
            errorCursor += 1
        }
        lastErrorClip = name
        return name
    }

    /// Pick the next clip for one click target, cycling its pool.
    func nextInteractionClip(for part: String) -> String {
        let pool = interactionVariants[part] ?? []
        guard !pool.isEmpty else { return part }
        let cursor = interactionCursors[part] ?? 0
        var index = cursor % pool.count
        if pool.count > 1, pool[index] == lastInteractionClip[part] { index = (index + 1) % pool.count }
        let name = pool[index]
        interactionCursors[part] = cursor + 1
        lastInteractionClip[part] = name
        return name
    }

    /// Enter the sleep sequence when the pet has been idle long enough.
    func beginSleep() {
        guard let start = sleepStart, let loop = sleepLoop,
              clips[start] != nil, clips[loop] != nil,
              !isSleeping, baseState == "IDLE", overlayClipName == nil, pulseState == nil else { return }
        isSleeping = true
        _ = playOverlay(start)
    }

    /// Leave sleep by playing the wake-up clip; the base state resumes after it.
    func wake() {
        guard isSleeping else { return }
        isSleeping = false
        if let end = sleepEnd, clips[end] != nil {
            overlayClipName = end
            activate(end)
        }
    }

    /// Rotate the celebration pool, never repeating the clip just played.
    private func nextSuccessClip() -> String {
        guard !successVariants.isEmpty else { return clip(for: "SUCCESS", activity: nil) }
        var name = successVariants[successCursor % successVariants.count]
        successCursor += 1
        if successVariants.count > 1, name == lastSuccessClip {
            name = successVariants[successCursor % successVariants.count]
            successCursor += 1
        }
        lastSuccessClip = name
        return name
    }

    func clip(for state: String, activity: String?) -> String {
        if state == "WORKING", let activity = activity, let mapped = workingActivityMap[activity] {
            return mapped
        }
        return stateMap[state] ?? stateMap["IDLE"] ?? baseClipName
    }

    private var underlayClipName: String {
        pulseClipName ?? baseClipName
    }

    private func activate(_ clipName: String) {
        guard activeClipName != clipName else { return }
        activeClipName = clipName
        frameIndex = 0
        frameElapsedMs = 0
    }

    private static func asInt(_ value: Any?, fallback: Int) -> Int {
        if let i = value as? Int { return i }
        if let d = value as? Double { return Int(d) }
        if let s = value as? String { return Int(s) ?? fallback }
        return fallback
    }
}
