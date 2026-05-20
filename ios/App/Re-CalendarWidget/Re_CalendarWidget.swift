import WidgetKit
import SwiftUI

// 🌟 データ構造
struct WidgetEvent: Codable, Identifiable {
    let id: String
    let title: String
    let start: String
    let end: String
    let color: String
    let category: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), events: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        completion(SimpleEntry(date: Date(), events: []))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let currentDate = Date()
        var events: [WidgetEvent] = []
        
        // 🌟 共有金庫（App Groups）からJSONファイルを読み込む
        if let sharedContainer = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.yourname.smartlifeos") {
            let fileURL = sharedContainer.appendingPathComponent("Library/Application Support/unis.com.taiyo.smartlifeos/schedule.json")
            if let data = try? Data(contentsOf: fileURL),
               let decoded = try? JSONDecoder().decode([WidgetEvent].self, from: data) {
                events = decoded
            }
        }
        
        // ※ダミーデータ強制追加のコードは削除しました。空の場合は空として扱われます。
        
        let timeline = Timeline(entries: [SimpleEntry(date: currentDate, events: events)], policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let events: [WidgetEvent]
}

// 🌟 24時間円形グラフ本体のデザイン
struct AnalogClockView: View {
    var events: [WidgetEvent]
    var lineWidth: CGFloat
    
    var body: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            // 🌟 サイズが長方形になってもはみ出さないように、短い方に合わせる
            let radius = min(geometry.size.width, geometry.size.height) / 2
            
            ZStack {
                // 1. 背景の円
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: lineWidth)
                    .frame(width: radius * 2, height: radius * 2)
                
                // 2. 24時間の目盛り
                ForEach(0..<24) { i in
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: i % 3 == 0 ? 2 : 1, height: i % 3 == 0 ? 8 : 5)
                        .offset(y: -radius + 4)
                        .rotationEffect(.degrees(Double(i) * 15))
                }
                
                // 3. 数字のガイド (0, 6, 12, 18)
                ForEach([0, 6, 12, 18], id: \.self) { hour in
                    Text("\(hour)")
                        .font(.system(size: 10, weight: .black))
                        .foregroundColor(.gray.opacity(0.6))
                        .position(
                            x: center.x + (radius - 18) * cos(CGFloat(hour * 15 - 90) * .pi / 180),
                            y: center.y + (radius - 18) * sin(CGFloat(hour * 15 - 90) * .pi / 180)
                        )
                }

                // 4. 予定の円弧を描画
                ForEach(events) { event in
                    if let (startH, endH) = parseHours(startIso: event.start, endIso: event.end) {
                        ClockArc(startHour: startH, endHour: endH)
                            .stroke(Color(hex: event.color), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                            .frame(width: radius * 2, height: radius * 2)
                    }
                }
            }
            .position(x: center.x, y: center.y) // 全体を中央に配置
        }
    }
    
    func parseHours(startIso: String, endIso: String) -> (Double, Double)? {
        let formatter = ISO8601DateFormatter()
        guard let sDate = formatter.date(from: startIso),
              let eDate = formatter.date(from: endIso) else { return nil }
        let cal = Calendar.current
        let s = Double(cal.component(.hour, from: sDate)) + Double(cal.component(.minute, from: sDate)) / 60.0
        let e = Double(cal.component(.hour, from: eDate)) + Double(cal.component(.minute, from: eDate)) / 60.0
        return (s, e)
    }
}

struct ClockArc: Shape {
    var startHour: Double
    var endHour: Double
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = rect.width / 2
        let startAngle = Angle(degrees: (startHour * 15) - 90)
        let endAngle = Angle(degrees: (endHour * 15) - 90)
        path.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
        return path
    }
}

// 🌟 ウィジェット全体のレイアウト
struct CalendarWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack {
            switch family {
            case .systemSmall:
                // 🟩 Small: 円形グラフを中央に配置
                AnalogClockView(events: entry.events, lineWidth: 14)
                    .padding(10)
                    .overlay(
                        Text(getTodayDay())
                            .font(.system(size: 22, weight: .black))
                    )
                    .widgetURL(URL(string: "smartlifeos://new-event"))
                
            case .systemLarge:
                // 🟨 Large (新規追加): 上に時計、下に5件のリスト表示
                VStack(spacing: 12) {
                    AnalogClockView(events: entry.events, lineWidth: 16)
                        .frame(height: 150) // 時計のサイズを固定
                        .padding(.top, 8)
                        .overlay(Text(getTodayDay()).font(.system(size: 28, weight: .black)).offset(y: 4))
                    
                    VStack(alignment: .leading, spacing: 10) {
                        Text("本日の予定")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.secondary)
                            .padding(.bottom, 2)
                        
                        if entry.events.isEmpty {
                            Spacer()
                            Text("予定はありません")
                                .font(.system(size: 16))
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .center)
                            Spacer()
                        } else {
                            ForEach(entry.events.prefix(5)) { event in
                                Link(destination: URL(string: "smartlifeos://record?event_id=\(event.id)")!) {
                                    HStack(spacing: 8) {
                                        Rectangle().fill(Color(hex: event.color)).frame(width: 4, height: 16).cornerRadius(2)
                                        Text(event.title).font(.system(size: 15, weight: .bold)).lineLimit(1)
                                        Spacer()
                                    }
                                }
                                .buttonStyle(.plain)
                                .foregroundColor(.primary)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                }
                
            default:
                // 🟦 Medium: 左にグラフ、右に3件リスト
                HStack(spacing: 20) {
                    AnalogClockView(events: entry.events, lineWidth: 10)
                        .frame(width: 120, height: 120)
                        .overlay(Text(getTodayDay()).font(.system(size: 18, weight: .black)))
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("本日の予定").font(.system(size: 12, weight: .bold)).foregroundColor(.secondary)
                        if entry.events.isEmpty {
                            Text("予定はありません").font(.system(size: 14)).foregroundColor(.gray)
                        } else {
                            ForEach(entry.events.prefix(3)) { event in
                                Link(destination: URL(string: "smartlifeos://record?event_id=\(event.id)")!) {
                                    HStack(spacing: 6) {
                                        Rectangle().fill(Color(hex: event.color)).frame(width: 3, height: 14)
                                        Text(event.title).font(.system(size: 13, weight: .bold)).lineLimit(1)
                                    }
                                }
                                .buttonStyle(.plain)
                                .foregroundColor(.primary)
                            }
                        }
                    }
                    Spacer()
                }
                .padding()
            }
        }
        .containerBackground(for: .widget) {
            Color(.systemBackground)
        }
    }
    
    func getTodayDay() -> String {
        let f = DateFormatter(); f.dateFormat = "d"; return f.string(from: Date())
    }
}

@main
struct CalendarWidget: Widget {
    let kind: String = "CalendarWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            CalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("24h 円形カレンダー")
        .description("今日一日の空き時間がひと目でわかる円形グラフ。")
        // 🌟 ここに .systemLarge を追加！
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// 🌟 カラー変換拡張
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 3: (r, g, b) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (r, g, b) = (128, 128, 128)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: 1)
    }
}
