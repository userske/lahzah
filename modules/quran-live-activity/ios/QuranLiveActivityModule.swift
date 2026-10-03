import ExpoModulesCore
import ActivityKit

public class QuranLiveActivityModule: Module {
  private var currentActivity: Any? = nil

  public func definition() -> ModuleDefinition {
    Name("QuranLiveActivity")

    AsyncFunction("startActivity") { (surahName: String, ayahNumber: Int, reciterName: String) in
      if #available(iOS 16.1, *) {
        // End any previously running activity first
        if let existing = self.currentActivity as? Activity<QuranPlayerAttributes> {
          Task { await existing.end(nil, dismissalPolicy: .immediate) }
          self.currentActivity = nil
        }

        let initialState = QuranPlayerAttributes.ContentState(
          surahName: surahName,
          ayahNumber: ayahNumber,
          reciterName: reciterName,
          isPlaying: true,
          progress: 0.0
        )
        
        let attributes = QuranPlayerAttributes()
        let content = ActivityContent(state: initialState, staleDate: nil)
        
        do {
          let activity = try Activity<QuranPlayerAttributes>.request(
            attributes: attributes,
            content: content,
            pushType: nil
          )
          self.currentActivity = activity
        } catch {
          print("[QuranLiveActivity] Error starting activity: \(error.localizedDescription)")
        }
      }
    }

    AsyncFunction("updateActivity") { (ayahNumber: Int, isPlaying: Bool, progress: Double) in
      if #available(iOS 16.1, *) {
        guard let activity = self.currentActivity as? Activity<QuranPlayerAttributes> else { return }
        
        // Preserve existing state, just update changing values
        let updatedState = QuranPlayerAttributes.ContentState(
          surahName: activity.content.state.surahName,
          ayahNumber: ayahNumber,
          reciterName: activity.content.state.reciterName,
          isPlaying: isPlaying,
          progress: progress
        )
        let content = ActivityContent(state: updatedState, staleDate: nil)
        
        Task {
          await activity.update(content)
        }
      }
    }

    AsyncFunction("endActivity") {
      if #available(iOS 16.1, *) {
        guard let activity = self.currentActivity as? Activity<QuranPlayerAttributes> else { return }
        Task {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }
}
