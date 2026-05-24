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
        // ISO8601フォーマットでパース（失敗したら他のフォーマットも試す）
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: start_at) { return d }
        
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: start_at)
    }
    var endDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: end_at) { return d }
        
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: end_at)
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
        // 1時間ごとにウィジェットを更新する
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
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

// MARK: - ウィジェット UI 本体 (iOS 17対応版)
struct CalendarWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            CircularDayView(entry: entry)
                .containerBackground(for: .widget) { Color("WidgetBackground").ignoresSafeArea() }
        case .systemMedium:
            WeeklyCalendarView(entry: entry)
                .containerBackground(for: .widget) { Color("WidgetBackground").ignoresSafeArea() }
        case .systemLarge: // 🌟 新規追加：今日の予定リスト（大サイズ用）
            TodayEventsListView(entry: entry)
                .containerBackground(for: .widget) { Color("WidgetBackground").ignoresSafeArea() }
        case .accessoryCircular: // ロック画面用（ショートカット追加）
            LockScreenAddShortcutView(entry: entry)
                .containerBackground(for: .widget) { Color.clear }
        case .accessoryRectangular: // ロック画面用（長方形・次の予定）
            LockScreenRectangularView(entry: entry)
                .containerBackground(for: .widget) { Color.clear }
        default:
            Text("対応していません")
                .containerBackground(for: .widget) { Color.clear }
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
            Circle().stroke(Color.gray.opacity(0.2), lineWidth: 12).padding(16)
            
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
    
    var body: some View {
        // 今日を含む週の始まり（日曜日など）を計算
        let calendar = Calendar.current
        let today = entry.date
        // 今日から過去・未来を含めた7日間を生成（今日を左端にする場合は 0..<7）
        let days = (0..<7).map { calendar.date(byAdding: .day, value: $0, to: today)! }
        
        HStack(alignment: .top, spacing: 6) {
            ForEach(days, id: \.self) { day in
                // 🌟 修正：タイムゾーンを考慮して正しくその日のイベントを抽出する
                let dayEvents = entry.events.filter { event in
                    guard let start = event.startDate else { return false }
                    return calendar.isDate(start, inSameDayAs: day)
                }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
                
                VStack(spacing: 4) {
                    Text(day, format: .dateTime.weekday())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(calendar.isDateInToday(day) ? .blue : .gray)
                    
                    Text(day, format: .dateTime.day())
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(calendar.isDateInToday(day) ? .blue : .primary)
                    
                    // 予定のドット
                    VStack(spacing: 2) {
                        ForEach(dayEvents.prefix(4)) { event in
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

// MARK: - 🌟 新規：今日の予定リスト (Large / Medium)
struct TodayEventsListView: View {
    var entry: Provider.Entry
    
    var body: some View {
        let todaysEvents = entry.events.filter { event in
            guard let start = event.startDate else { return false }
            return Calendar.current.isDate(start, inSameDayAs: entry.date)
        }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
        
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(entry.date, format: .dateTime.month().day().weekday())
                    .font(.headline)
                    .foregroundColor(.blue)
                Spacer()
                Text("\(todaysEvents.count)件の予定")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.bottom, 4)
            
            if todaysEvents.isEmpty {
                Spacer()
                Text("今日の予定はありません")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(todaysEvents.prefix(6)) { event in
                        HStack(alignment: .center, spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: event.metadata?.customColor ?? "#3b82f6"))
                                .frame(width: 4, height: 24)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(event.title)
                                    .font(.system(size: 14, weight: .bold))
                                    .lineLimit(1)
                                
                                if let start = event.startDate {
                                    Text(start, style: .time)
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                    }
                }
            }
            Spacer()
        }
        .padding()
    }
}


// MARK: - 🔒 ロック画面用ショートカットウィジェット (予定追加)
struct LockScreenAddShortcutView: View {
    var entry: Provider.Entry
    var body: some View {
        ZStack {
            Image(systemName: "plus.circle.fill")
                .resizable()
                .scaledToFit()
                .padding(4)
        }
        // 🌟 修正：React側でリスナーを設定し、このURLを受け取ってモーダルを開く
        .widgetURL(URL(string: "smartlifeos://add-event"))
    }
}

// MARK: - 🔒 ロック画面用ウィジェット (次の予定)
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
        .description("予定やショートカットを配置できます。")
        // 🌟 新規：.systemLarge を追加して日ごとの予定リストに対応
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
    }
}
