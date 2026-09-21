import ActivityKit
import Foundation

public struct QuranPlayerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var surahName: String
        var ayahNumber: Int
        var reciterName: String
        var isPlaying: Bool
        var progress: Double // 0.0 to 1.0
        
        public init(surahName: String, ayahNumber: Int, reciterName: String, isPlaying: Bool, progress: Double) {
            self.surahName = surahName
            self.ayahNumber = ayahNumber
            self.reciterName = reciterName
            self.isPlaying = isPlaying
            self.progress = progress
        }
    }
    
    public init() {}
}
