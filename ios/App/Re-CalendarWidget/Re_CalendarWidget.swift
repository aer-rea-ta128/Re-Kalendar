import WidgetKit
import SwiftUI

// MARK: - データの型定義 (React側のJSONと完全に一致させる)
struct SharedEvent: Codable, Identifiable {
    let id: String
    let title: String
    let start_at: String
    let end_at: String
    let category: String
    let metadata: SharedMetadata?
    
    var startDate: Date? {
        ISO8601DateFormatter().date(from: start_at)
    }
    var endDate: Date? {
        ISO8601DateFormatter().date(from: end_at)
    }
}

struct SharedMetadata: Codable {
    let customColor: String?
    let isAllDayBackground: Bool?
    let location: String?
}

// MARK: - プロバイダー (データ取得ロジック)
struct Provider: TimelineProvider {
    // 🌟 App Group IDを自分のものに変更してください（例: group.com.yourname.app）
    let appGroupId = "group.com.yourcompany.app"
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), events: getMockEvents())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), events: fetchEventsFromAppGroup())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let events = fetchEventsFromAppGroup()
        let entry = SimpleEntry(date: Date(), events: events)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
    
    private func fetchEventsFromAppGroup() -> [SharedEvent] {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId),
              let jsonString = sharedDefaults.string(forKey: "widget_events_data"),
              let jsonData = jsonString.data(using: .utf8) else {
            return []
        }
        do {
            return try JSONDecoder().decode([SharedEvent].self, from: jsonData)
        } catch {
            print("Widget Decode Error: \(error)")
            return []
        }
    }
    
    private func getMockEvents() -> [SharedEvent] {
        return [
            SharedEvent(id: "1", title: "MTG", start_at: "2026-05-24T10:00:00Z", end_at: "2026-05-24T11:00:00Z", category: "仕事", metadata: SharedMetadata(customColor: "#4D96FF", isAllDayBackground: false, location: "会議室"))
        ]
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let events: [SharedEvent]
}

// MARK: - ウィジェット UI 本体
struct CalendarWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            CircularDayView(entry: entry) // 🌟 1日の円形タイムライン
        case .systemMedium:
            WeeklyCalendarView(entry: entry) // 🌟 1週間の予定表示
        case .accessoryCircular: // 🌟 ロック画面用（円）
            LockScreenCircularView(entry: entry)
        case .accessoryRectangular: // 🌟 ロック画面用（長方形）
            LockScreenRectangularView(entry: entry)
        default:
            Text("対応していません")
        }
    }
}

// MARK: - 🎨 1日の円形タイムライン (Small)
struct CircularDayView: View {
    var entry: Provider.Entry
    
    var body: some View {
        let todaysEvents = entry.events.filter { event in
            guard let start = event.startDate else { return false }
            return Calendar.current.isDate(start, inSameDayAs: entry.date)
        }
        
        ZStack {
            Color("WidgetBackground").ignoresSafeArea()
            
            // 時計のベース円
            Circle()
                .stroke(Color.gray.opacity(0.2), lineWidth: 12)
                .padding(16)
            
            // 予定の円弧を描画
            ForEach(todaysEvents) { event in
                if let start = event.startDate, let end = event.endDate {
                    let startAngle = angle(for: start)
                    let endAngle = angle(for: end)
                    
                    Circle()
                        .trim(from: startAngle, to: endAngle)
                        .stroke(Color(hex: event.metadata?.customColor ?? "#3b82f6"), style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .padding(16)
                }
            }
            
            VStack(spacing: 2) {
                Text(entry.date, format: .dateTime.day())
                    .font(.system(size: 24, weight: .black, design: .rounded))
                Text("予定 \(todaysEvents.count)件")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.gray)
            }
        }
    }
    
    // 時間から0.0〜1.0の割合を計算
    private func angle(for date: Date) -> CGFloat {
        let hour = Calendar.current.component(.hour, from: date)
        let minute = Calendar.current.component(.minute, from: date)
        let totalMinutes = CGFloat(hour * 60 + minute)
        return totalMinutes / (24.0 * 60.0)
    }
}

// MARK: - 🎨 週間カレンダー (Medium)
struct WeeklyCalendarView: View {
    var entry: Provider.Entry
    let days = (0..<7).map { Calendar.current.date(byAdding: .day, value: $0, to: Date())! }
    
    var body: some View {
        HStack(alignment: .top, spacing: 6) {
            ForEach(days, id: \.self) { day in
                let dayEvents = entry.events.filter { Calendar.current.isDate($0.startDate ?? Date(), inSameDayAs: day) }
                
                VStack(spacing: 4) {
                    Text(day, format: .dateTime.weekday())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Calendar.current.isDateInToday(day) ? .blue : .gray)
                    
                    Text(day, format: .dateTime.day())
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(Calendar.current.isDateInToday(day) ? .blue : .primary)
                    
                    // 予定のドット
                    VStack(spacing: 2) {
                        ForEach(dayEvents.prefix(3)) { event in
                            Circle()
                                .fill(Color(hex: event.metadata?.customColor ?? "#3b82f6"))
                                .frame(width: 6, height: 6)
                        }
                    }
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
    }
}

// MARK: - 🔒 ロック画面用ウィジェット
struct LockScreenCircularView: View {
    var entry: Provider.Entry
    var body: some View {
        let todaysEvents = entry.events.filter { Calendar.current.isDate($0.startDate ?? Date(), inSameDayAs: entry.date) }
        Gauge(value: Double(todaysEvents.count), in: 0...5) {
            Image(systemName: "calendar")
        } currentValueLabel: {
            Text("\(todaysEvents.count)")
        }
        .gaugeStyle(.accessoryCircular)
    }
}

struct LockScreenRectangularView: View {
    var entry: Provider.Entry
    var body: some View {
        let nextEvent = entry.events.filter { ($0.startDate ?? Date()) > Date() }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }.first
        
        VStack(alignment: .leading) {
            HStack {
                Image(systemName: "calendar")
                Text("次の予定").font(.headline)
            }
            if let event = nextEvent {
                Text(event.title)
                    .lineLimit(1)
                    .font(.body.bold())
            } else {
                Text("今日の予定は完了").font(.body)
            }
        }
    }
}

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue:  Double(b) / 255, opacity: Double(a) / 255)
    }
}

@main
struct CalendarWidget: Widget {
    let kind: String = "CalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            CalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("SmartLifeOS カレンダー")
        .description("予定をひと目で確認できます。")
        // サポートするウィジェットの種類を宣言
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }
}
