import WidgetKit
import SwiftUI
import ActivityKit

@main
struct QuranWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: QuranPlayerAttributes.self) { context in
            // Lock screen / Banner UI
            VStack {
                HStack {
                    Image(systemName: "book.fill")
                        .foregroundColor(.green)
                    Text("Lahzah")
                        .font(.headline)
                    Spacer()
                    if context.state.isPlaying {
                        Image(systemName: "waveform")
                            .foregroundColor(.green)
                    }
                }
                .padding(.bottom, 4)

                HStack {
                    VStack(alignment: .leading) {
                        Text(context.state.surahName)
                            .font(.title3)
                            .bold()
                        Text("Ayah \(context.state.ayahNumber) • \(context.state.reciterName)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: context.state.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                        .resizable()
                        .frame(width: 32, height: 32)
                        .foregroundColor(.green)
                }
            }
            .padding()
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "book.fill")
                        .foregroundColor(.green)
                        .padding(.top, 8)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Image(systemName: context.state.isPlaying ? "waveform" : "pause.fill")
                        .foregroundColor(.green)
                        .padding(.top, 8)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text("\(context.state.surahName) - Ayah \(context.state.ayahNumber)")
                        .bold()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.reciterName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Image(systemName: context.state.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.title2)
                    }
                }
            } compactLeading: {
                Image(systemName: "book.fill")
                    .foregroundColor(.green)
            } compactTrailing: {
                Image(systemName: context.state.isPlaying ? "waveform" : "pause.fill")
                    .foregroundColor(.green)
            } minimal: {
                Image(systemName: "book.fill")
                    .foregroundColor(.green)
            }
        }
    }
}
