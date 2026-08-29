import WidgetKit
import SwiftUI

// MARK: - 1. データの型定義
struct SharedEvent: Codable, Identifiable {
    let id: String
    let title: String
    let start: String
    let end: String?
    let extendedProps: ExtendedProps?
    
    var startDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: start) { return d }
        
        formatter.formatOptions = [.withInternetDateTime]
        if let d = formatter.date(from: start) { return d }
        
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: start)
    }
    
    var endDate: Date? {
        guard let endStr = end else { return startDate }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: endStr) { return d }
        
        formatter.formatOptions = [.withInternetDateTime]
        if let d = formatter.date(from: endStr) { return d }
        
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: endStr)
    }
}

struct ExtendedProps: Codable {
    let category: String?
    let metadata: SharedMetadata?
    let customColor: String?
    let cColor: String?
}

struct SharedMetadata: Codable {
    let customColor: String?
    let isAllDayBackground: Bool?
    let location: String?
    
    // 🌟 追加：交通機関のデータ
    let isTransit: Bool?
    let transitType: String?
    let transitDepTime: String?
    let transitArrTime: String?
    let hasReturnTransit: Bool?
    let returnTransitType: String?
    let returnTransitDepTime: String?
    let returnTransitArrTime: String?
}

// 🌟 日付計算。深夜0時またぎや終日予定の「+1日ズレ」を防ぐ
extension SharedEvent {
    var inclusiveEndDate: Date {
        guard let s = startDate else { return Date() }
        let e = endDate ?? s
        
        let calendar = Calendar.current
        let isAllDay = (extendedProps?.metadata?.isAllDayBackground == true) || (start.count <= 10)
        
        if isAllDay {
            if calendar.startOfDay(for: e) > calendar.startOfDay(for: s) {
                return calendar.date(byAdding: .day, value: -1, to: e) ?? e
            }
        } else {
            let h = calendar.component(.hour, from: e)
            let m = calendar.component(.minute, from: e)
            if h == 0 && m == 0 && e > s {
                return calendar.date(byAdding: .second, value: -1, to: e) ?? e
            }
        }
        return e
    }
    
    func isIncluded(in targetDate: Date, calendar: Calendar = .current) -> Bool {
        guard let start = startDate else { return false }
        let end = inclusiveEndDate
        
        let startOfDayEvent = calendar.startOfDay(for: start)
        let endOfDayEvent = calendar.date(bySettingHour: 23, minute: 59, second: 59, of: end) ?? end
        let targetStart = calendar.startOfDay(for: targetDate)
        
        return targetStart >= startOfDayEvent && targetStart <= endOfDayEvent
    }
}

// MARK: - 2. プロバイダー (データ取得)
struct Provider: TimelineProvider {
    let appGroupId = "group.com.yourname.smartlifeos"
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), events: getMockEvents(), debugMessage: "Placeholder")
    }
    
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let fetchResult = fetchEventsFromAppGroup()
        let entry = SimpleEntry(date: Date(), events: fetchResult.events, debugMessage: fetchResult.message)
        completion(entry)
    }
    
    // 🌟 最適化: 15分刻みで未来のタイムラインエントリを複数生成し、アプリ未起動でも自動更新
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let fetchResult = fetchEventsFromAppGroup()
        let currentDate = Date()
        var entries: [SimpleEntry] = []
        
        // 15分間隔で4時間先（計16エントリ）まで事前に生成してOSへ渡す
        for minuteOffset in stride(from: 0, to: 240, by: 15) {
            if let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: currentDate) {
                entries.append(SimpleEntry(date: entryDate, events: fetchResult.events, debugMessage: fetchResult.message))
            }
        }
        
        // タイムライン終了時（4時間後）に次のタイムラインを再要求
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    private func fetchEventsFromAppGroup() -> (events: [SharedEvent], message: String) {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
            return ([], "❌ AppGroupが見つかりません。")
        }
        let jsonString = sharedDefaults.string(forKey: "widget_events_data")
        guard let json = jsonString, !json.isEmpty else {
            return ([], "⚠️ データなし: 'widget_events_data' が空です。")
        }
        guard let jsonData = json.data(using: .utf8) else {
            return ([], "❌ 変換エラー: JSONの破損。")
        }
        do {
            let decodedEvents = try JSONDecoder().decode([SharedEvent].self, from: jsonData)
            return (decodedEvents, "✅ 成功: \(decodedEvents.count)件取得")
        } catch {
            let errorMsg = String(describing: error).prefix(50)
            return ([], "❌ デコードエラー: \(errorMsg)...")
        }
    }
    
    private func getMockEvents() -> [SharedEvent] {
        return [
            SharedEvent(id: "1", title: "プレビュー", start: "2026-05-24T10:00:00Z", end: "2026-05-24T11:00:00Z", extendedProps: ExtendedProps(category: "仕事", metadata: SharedMetadata(customColor: "#4D96FF", isAllDayBackground: false, location: "", isTransit: false, transitType: nil, transitDepTime: nil, transitArrTime: nil, hasReturnTransit: false, returnTransitType: nil, returnTransitDepTime: nil, returnTransitArrTime: nil), customColor: nil, cColor: nil))
        ]
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let events: [SharedEvent]
    let debugMessage: String
}

// MARK: - 🎨 交通機関の移動帯とアイコンを描画する専用ビュー (NEW)
struct TransitIndicatorView: View {
    var depTimeStr: String
    var arrTimeStr: String
    var type: String?
    var color: Color
    var radius: CGFloat
    var strokeWidth: CGFloat
    var center: CGPoint
    var now: Date
    var calendar: Calendar
    
    private func parseTime(_ timeStr: String) -> Int? {
        let comps = timeStr.split(separator: ":")
        guard comps.count == 2, let h = Int(comps[0]), let m = Int(comps[1]) else { return nil }
        return h * 60 + m
    }
    
    var body: some View {
        Group {
            if let depMin = parseTime(depTimeStr), let arrMin = parseTime(arrTimeStr) {
                let actualArrMin = (arrMin <= depMin) ? arrMin + 1440 : arrMin
                let sAngle = CGFloat(depMin) / 1440.0
                let eAngle = CGFloat(actualArrMin) / 1440.0
                
                let currentMinRaw = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
                let currentMin = (actualArrMin > 1440 && currentMinRaw < depMin) ? currentMinRaw + 1440 : currentMinRaw
                
                ZStack {
                    // ① 交通機関の移動時間を示す点線の帯
                    Circle()
                        .trim(from: sAngle, to: eAngle)
                        .stroke(color, style: StrokeStyle(lineWidth: strokeWidth * 0.35, lineCap: .round, dash: [4, 5]))
                        .rotationEffect(.degrees(-90))
                        .frame(width: radius * 2, height: radius * 2)
                        .opacity(0.8)
                    
                    // ② 現在時刻が移動時間内なら、アイコンをその位置に表示する
                    if currentMin >= depMin && currentMin <= actualArrMin {
                        let currentAngle = Angle(degrees: (Double(currentMin) / 1440.0) * 360 - 90)
                        let iconName: String = {
                            switch type {
                            case "plane": return "airplane"
                            case "bus": return "bus.fill"
                            default: return "train.side.front.car"
                            }
                        }()
                        
                        ZStack {
                            Circle().fill(Color.white).frame(width: 18, height: 18)
                                .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                            Image(systemName: iconName)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(color)
                        }
                        .position(
                            x: center.x + radius * CGFloat(cos(currentAngle.radians)),
                            y: center.y + radius * CGFloat(sin(currentAngle.radians))
                        )
                    }
                }
            }
        }
    }
}

// MARK: - 🎨 柔軟な背景帯を描画する専用ビュー
struct EventBandView: View {
    var isStart: Bool
    var isEnd: Bool
    var color: Color
    
    var body: some View {
        Group {
            if isStart && isEnd {
                Circle()
                    .fill(color)
                    .frame(width: 26, height: 26)
            } else if isStart {
                ZStack {
                    RoundedRectangle(cornerRadius: 13).fill(color)
                    HStack(spacing: 0) {
                        Color.clear.frame(width: 13)
                        Rectangle().fill(color)
                    }
                }
                .compositingGroup()
            } else if isEnd {
                ZStack {
                    RoundedRectangle(cornerRadius: 13).fill(color)
                    HStack(spacing: 0) {
                        Rectangle().fill(color)
                        Color.clear.frame(width: 13)
                    }
                }
                .compositingGroup()
            } else {
                Rectangle().fill(color)
            }
        }
    }
}

// MARK: - 3. ウィジェット UI 本体
struct CalendarWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme
    
    var textColor: Color { colorScheme == .dark ? Color.white : Color.black }
    var subTextColor: Color { colorScheme == .dark ? Color.gray : Color(white: 0.4) }
    
    var body: some View {
        VStack {
            switch family {
            case .systemSmall:
                CircularDayView(entry: entry, textColor: textColor, subTextColor: subTextColor)
                    .widgetURL(URL(string: "smartlifeos://today"))
            case .systemMedium:
                WeeklyCalendarView(entry: entry, textColor: textColor, subTextColor: subTextColor)
                    .widgetURL(URL(string: "smartlifeos://week"))
            case .systemLarge:
                FuturisticDailyView(entry: entry, textColor: textColor, subTextColor: subTextColor)
                    .widgetURL(URL(string: "smartlifeos://today"))
            case .accessoryCircular:
                LockScreenAddShortcutView(entry: entry)
            case .accessoryRectangular:
                LockScreenRectangularView(entry: entry)
            default:
                Text("対応していません").foregroundColor(textColor)
            }
        }
        .containerBackground(for: .widget) { Color.clear }
    }
}

// MARK: - 🎨 日毎の時計型カレンダー (Largeサイズ用)
struct FuturisticDailyView: View {
    var entry: Provider.Entry
    var textColor: Color
    var subTextColor: Color
    
    var body: some View {
        let calendar = Calendar.current
        
        let todaysEvents: [SharedEvent] = entry.events.filter { event in
            event.isIncluded(in: entry.date, calendar: calendar)
        }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
        
        let allDayEvents: [SharedEvent] = todaysEvents.filter { event in
            let isBackground = event.extendedProps?.metadata?.isAllDayBackground ?? false
            let isDateOnly = event.start.count <= 10
            return isBackground || isDateOnly
        }
        
        let timeEvents: [SharedEvent] = todaysEvents.filter { event in
            !allDayEvents.contains(where: { $0.id == event.id })
        }
        
        let centerEventColor = allDayEvents.first?.extendedProps?.cColor ?? allDayEvents.first?.extendedProps?.metadata?.customColor
        
        let now = entry.date
        let nextEvent = timeEvents.first { event in
            let end = event.endDate ?? event.startDate ?? entry.date
            return end > now
        } ?? allDayEvents.first { event in
            let end = event.inclusiveEndDate
            return end > now
        }
        
        ZStack {
            if let cColor = centerEventColor {
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color(hex: cColor).opacity(0.12))
                    .padding(4)
            }
            
            VStack(spacing: 2) {
                Text(entry.date, format: .dateTime.month().day().weekday())
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(subTextColor)
                    .padding(.top, 4)
                    .offset(y: -10)
                
                GeometryReader { geometry in
                    let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
                    let radius = min(geometry.size.width, geometry.size.height) / 2 * 0.78
                    let strokeWidth: CGFloat = 16
                    
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.15), lineWidth: strokeWidth)
                            .frame(width: radius * 2, height: radius * 2)
                        
                        if let cColor = centerEventColor {
                            Circle()
                                .fill(Color(hex: cColor).opacity(0.2))
                                .frame(width: radius * 1.5, height: radius * 1.5)
                        }
                        
                        ForEach(0..<24, id: \.self) { hour in
                            let angle = Angle(degrees: Double(hour) * 15 - 90)
                            if hour % 3 == 0 {
                                Text("\(hour)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(subTextColor.opacity(0.7))
                                    .position(x: center.x + (radius + strokeWidth/2 + 14) * CGFloat(cos(angle.radians)),
                                              y: center.y + (radius + strokeWidth/2 + 14) * CGFloat(sin(angle.radians)))
                            } else {
                                Circle().fill(Color.gray.opacity(0.4)).frame(width: 2, height: 2)
                                    .position(x: center.x + (radius + strokeWidth/2 + 10) * CGFloat(cos(angle.radians)),
                                              y: center.y + (radius + strokeWidth/2 + 10) * CGFloat(sin(angle.radians)))
                            }
                        }
                        
                        ForEach(timeEvents) { event in
                            let start = event.startDate!
                            let end = event.endDate ?? start
                            let startMin = calendar.component(.hour, from: start) * 60 + calendar.component(.minute, from: start)
                            let endRaw = calendar.component(.hour, from: end) * 60 + calendar.component(.minute, from: end)
                            // 日またぎの予定は24時間(1440分)を加算
                            let endMin = (endRaw <= startMin) ? endRaw + 1440 : endRaw
                            
                            let sAngle = CGFloat(startMin) / 1440.0
                            let eAngle = CGFloat(endMin) / 1440.0
                            let color = Color(hex: event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6")
                            
                            // 現在時刻の分数を計算
                            let currentMinRaw = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
                            let currentMin = (endMin > 1440 && currentMinRaw < startMin) ? currentMinRaw + 1440 : currentMinRaw
                            
                            // ① まず全体を薄く描画（過去の部分のベースになる）
                            Circle()
                                .trim(from: sAngle, to: eAngle)
                                .stroke(color, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
                                .rotationEffect(.degrees(-90))
                                .frame(width: radius * 2, height: radius * 2)
                                .opacity(0.3)
                            
                            // ② 現在時刻から終了時刻までの未来部分があれば、濃く重ねて描画する
                            if currentMin < endMin {
                                let futureStartMin = max(startMin, currentMin)
                                let fsAngle = CGFloat(futureStartMin) / 1440.0
                                
                                Circle()
                                    .trim(from: fsAngle, to: eAngle)
                                    .stroke(color, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
                                    .rotationEffect(.degrees(-90))
                                    .frame(width: radius * 2, height: radius * 2)
                                    .opacity(0.85)
                            }
                            
                            // 🌟 交通機関の帯が予定に被らないよう、半径を内側にずらす
                            let innerRadius = radius - strokeWidth + 2
                            
                            // 🌟 交通機関（往路）の点線帯とアイコン描画
                            if event.extendedProps?.metadata?.isTransit == true,
                               let depStr = event.extendedProps?.metadata?.transitDepTime,
                               let arrStr = event.extendedProps?.metadata?.transitArrTime {
                                TransitIndicatorView(depTimeStr: depStr, arrTimeStr: arrStr, type: event.extendedProps?.metadata?.transitType, color: color, radius: innerRadius, strokeWidth: strokeWidth, center: center, now: now, calendar: calendar)
                            }
                            
                            // 🌟 交通機関（復路）の点線帯とアイコン描画
                            if event.extendedProps?.metadata?.hasReturnTransit == true,
                               let depStr = event.extendedProps?.metadata?.returnTransitDepTime,
                               let arrStr = event.extendedProps?.metadata?.returnTransitArrTime {
                                TransitIndicatorView(depTimeStr: depStr, arrTimeStr: arrStr, type: event.extendedProps?.metadata?.returnTransitType, color: color, radius: innerRadius, strokeWidth: strokeWidth, center: center, now: now, calendar: calendar)
                            }
                        }
                        
                        let currentAngle = Angle(degrees: (Double(calendar.component(.hour, from: entry.date) * 60 + calendar.component(.minute, from: entry.date)) / 1440.0) * 360 - 90)
                        
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                            .position(x: center.x + radius * CGFloat(cos(currentAngle.radians)),
                                      y: center.y + radius * CGFloat(sin(currentAngle.radians)))
                            .shadow(color: Color.red.opacity(0.8), radius: 5, x: 0, y: 0)
                        
                        VStack(spacing: -2) {
                            Text(Date(), style: .time)
                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                                .foregroundColor(subTextColor)
                            
                            Text(entry.date, format: .dateTime.day())
                                .font(.system(size: 52, weight: .black, design: .rounded))
                                .foregroundColor(centerEventColor != nil ? Color(hex: centerEventColor!) : textColor)
                            
                            if let next = nextEvent, let start = next.startDate {
                                let isAllDay = (next.extendedProps?.metadata?.isAllDayBackground == true) || (next.start.count <= 10)
                                let c = Color(hex: next.extendedProps?.cColor ?? next.extendedProps?.metadata?.customColor ?? "#3b82f6")
                                
                                HStack(spacing: 4) {
                                    Text("NEXT")
                                        .font(.system(size: 9, weight: .black))
                                        .padding(.horizontal, 4)
                                        .padding(.vertical, 2)
                                        .background(c.opacity(0.2))
                                        .cornerRadius(4)
                                    
                                    Text(isAllDay ? "終日" : start.formatted(.dateTime.hour().minute()))
                                        .font(.system(size: 12, weight: .heavy))
                                }
                                .foregroundColor(c)
                            } else {
                                Text("予定完了")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(subTextColor.opacity(0.6))
                            }
                        }
                    }
                }
                
                VStack {
                    if let event = nextEvent {
                        let colorHex = event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6"
                        
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: colorHex))
                                .frame(width: 4, height: 28)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 8) {
                                    if let start = event.startDate {
                                        if event.extendedProps?.metadata?.isAllDayBackground == true || event.start.count <= 10 {
                                            Text("終日")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(Color(hex: colorHex))
                                        } else {
                                            let endStr = event.endDate != nil && event.endDate != start ? " - \(event.endDate!.formatted(.dateTime.hour().minute()))" : ""
                                            Text("\(start.formatted(.dateTime.hour().minute()))\(endStr)")
                                                .font(.system(size: 11, weight: .heavy))
                                                .foregroundColor(textColor)
                                        }
                                    }
                                    
                                    if let location = event.extendedProps?.metadata?.location, !location.isEmpty {
                                        HStack(spacing: 2) {
                                            Image(systemName: "mappin.and.ellipse").font(.system(size: 9))
                                            Text(location).font(.system(size: 11, weight: .medium))
                                        }
                                        .foregroundColor(subTextColor)
                                    }
                                }
                                // 🌟 修正: 幅を固定(frame width: 82)して行き・帰りの幅を完全一致に統一
                                HStack(alignment: .center, spacing: 4) {
                                    Text(event.title)
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundColor(subTextColor)
                                        .lineLimit(1)
                                    Spacer(minLength: 0)
                                    
                                    if event.extendedProps?.metadata?.isTransit == true {
                                        let meta = event.extendedProps?.metadata
                                        VStack(alignment: .trailing, spacing: 1.5) {
                                            if let dTime = meta?.transitDepTime, let aTime = meta?.transitArrTime {
                                                let tIcon = meta?.transitType == "plane" ? "airplane" : (meta?.transitType == "bus" ? "bus.fill" : "train.side.front.car")
                                                HStack(spacing: 2) {
                                                    Image(systemName: tIcon)
                                                    Text("\(dTime)-\(aTime)")
                                                        .monospacedDigit()
                                                }
                                                .font(.system(size: 8, weight: .bold))
                                                .foregroundColor(subTextColor.opacity(0.85))
                                                .frame(width: 82)
                                                .padding(.vertical, 1)
                                                .background(Color.gray.opacity(0.15)).cornerRadius(3)
                                            }
                                            if meta?.hasReturnTransit == true, let rdTime = meta?.returnTransitDepTime, let raTime = meta?.returnTransitArrTime {
                                                let rIcon = meta?.returnTransitType == "plane" ? "airplane" : (meta?.returnTransitType == "bus" ? "bus.fill" : "train.side.front.car")
                                                HStack(spacing: 2) {
                                                    Image(systemName: rIcon)
                                                    Text("\(rdTime)-\(raTime)")
                                                        .monospacedDigit()
                                                }
                                                .font(.system(size: 8, weight: .bold))
                                                .foregroundColor(subTextColor.opacity(0.85))
                                                .frame(width: 82)
                                                .padding(.vertical, 1)
                                                .background(Color.gray.opacity(0.15)).cornerRadius(3)
                                            }
                                        }
                                    }
                                }
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                    } else {
                        Text("今日これ以降予定はありません")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(subTextColor.opacity(0.6))
                            .padding(.vertical, 8)
                    }
                }
                .padding(.bottom, 8)
                .padding(.horizontal, 8)
                .offset(y: 8)
            }
            .padding(.horizontal, 12)
        }
    }
}

// MARK: - 🎨 1日の円形タイムライン (Small用)
struct CircularDayView: View {
    var entry: Provider.Entry
    var textColor: Color
    var subTextColor: Color
    
    var body: some View {
        let calendar = Calendar.current
        let todaysEvents: [SharedEvent] = entry.events.filter { event in
            event.isIncluded(in: entry.date, calendar: calendar)
        }
        
        let allDayEvent = todaysEvents.first(where: { ($0.extendedProps?.metadata?.isAllDayBackground == true) || ($0.start.count <= 10) })
        
        ZStack {
            if let event = allDayEvent {
                let c = Color(hex: event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6")
                RoundedRectangle(cornerRadius: 20)
                    .fill(c.opacity(0.15))
                    .padding(4)
            }
            
            Circle().stroke(Color.gray.opacity(0.2), lineWidth: 12).padding(16)
            
            ForEach(todaysEvents, id: \.id) { (event: SharedEvent) in
                if let start = event.startDate, let end = event.endDate {
                    let startAngle = angle(for: start)
                    let endAngle = angle(for: end)
                    Circle()
                        .trim(from: startAngle, to: endAngle)
                        .stroke(Color(hex: event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6"), style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .padding(16)
                }
            }
            
            VStack(spacing: 2) {
                Text(entry.date, format: .dateTime.day())
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundColor(textColor)
                
                if todaysEvents.isEmpty {
                    Text("予定なし").font(.system(size: 10, weight: .bold)).foregroundColor(subTextColor)
                } else {
                    Text("予定 \(todaysEvents.count)件").font(.system(size: 10, weight: .bold)).foregroundColor(subTextColor)
                }
            }
        }
    }
    
    private func angle(for date: Date) -> CGFloat {
        let hour = Calendar.current.component(.hour, from: date)
        let minute = Calendar.current.component(.minute, from: date)
        return CGFloat(hour * 60 + minute) / 1440.0
    }
}

// MARK: - 📅 日付判定の拡張
extension Date {
    func isSunday(calendar: Calendar = .current) -> Bool { return calendar.component(.weekday, from: self) == 1 }
    func isSaturday(calendar: Calendar = .current) -> Bool { return calendar.component(.weekday, from: self) == 7 }
    func isJapaneseHoliday(calendar: Calendar = .current) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM-dd"
        let holidays = ["01-01", "01-12", "02-11", "02-23", "03-20", "04-29", "05-03", "05-04", "05-05", "05-06", "07-20", "08-11", "09-21", "09-22", "09-23", "10-12", "11-03", "11-23"]
        return holidays.contains(formatter.string(from: self))
    }
}

// MARK: - 🎨 ユーティリティ拡張 (Color)
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue:  Double(b) / 255, opacity: Double(a) / 255)
    }
}

// MARK: - 🎨 週間カレンダー (Medium用)
struct WeeklyCalendarView: View {
    var entry: Provider.Entry
    var textColor: Color
    var subTextColor: Color
    
    var body: some View {
        let calendar = Calendar.current
        let today = entry.date
        let days = (0..<7).map { calendar.date(byAdding: .day, value: $0, to: today)! }
        
        let now = Date()
        let allFutureEvents: [SharedEvent] = entry.events.filter { event in
            let end = event.inclusiveEndDate
            return end >= now
        }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
        
        let displayEvents = Array(allFutureEvents.prefix(2))
        
        VStack(spacing: 12) {
            HStack(alignment: .top, spacing: 0) {
                ForEach(days, id: \.self) { day in
                    let isToday = calendar.isDateInToday(day)
                    let isSun = day.isSunday(calendar: calendar) || day.isJapaneseHoliday(calendar: calendar)
                    let isSat = day.isSaturday(calendar: calendar)
                    
                    let dayColor: Color = isToday ? .blue : (isSun ? .red : (isSat ? .blue.opacity(0.8) : subTextColor))
                    let dateColor: Color = isToday ? .white : (isSun ? .red : (isSat ? .blue.opacity(0.8) : textColor))
                    
                    let dayEvents: [SharedEvent] = entry.events.filter { event in
                        event.isIncluded(in: day, calendar: calendar)
                    }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
                    
                    let allDayEvent = dayEvents.first(where: { ($0.extendedProps?.metadata?.isAllDayBackground == true) || ($0.start.count <= 10) })
                    
                    VStack(spacing: 6) {
                        Text(day, format: .dateTime.weekday())
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(dayColor)
                        
                        VStack(spacing: 4) {
                            ZStack {
                                if let event = allDayEvent {
                                    let cColor = Color(hex: event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6")
                                    let eStart = calendar.startOfDay(for: event.startDate ?? Date())
                                    let eEnd = calendar.startOfDay(for: event.inclusiveEndDate)
                                    let isStart = calendar.isDate(day, inSameDayAs: eStart)
                                    let isEnd = calendar.isDate(day, inSameDayAs: eEnd)
                                    
                                    EventBandView(isStart: isStart, isEnd: isEnd, color: cColor)
                                        .opacity(0.3)
                                }
                                
                                if isToday {
                                    Circle().fill(Color.blue).frame(width: 24, height: 24)
                                }
                                Text(day, format: .dateTime.day())
                                    .font(.system(size: 15, weight: isToday ? .black : .medium))
                                    .foregroundColor(dateColor)
                            }
                            .frame(height: 26)
                            
                            HStack(spacing: 2) {
                                let timeEvents = dayEvents.filter { !($0.extendedProps?.metadata?.isAllDayBackground == true || $0.start.count <= 10) }
                                let topEvents = Array(timeEvents.prefix(3))
                                
                                if topEvents.isEmpty {
                                    Circle().fill(Color.clear).frame(width: 4, height: 4)
                                } else {
                                    ForEach(topEvents, id: \.id) { event in
                                        let colorHex = event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6"
                                        Circle().fill(Color(hex: colorHex)).frame(width: 4, height: 4)
                                    }
                                }
                            }
                            .frame(height: 4)
                        }
                        .padding(.vertical, 6)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 2)
            .padding(.top, 4)
            
            HStack(spacing: 8) {
                if displayEvents.isEmpty {
                    Spacer()
                    Text("直近の予定はありません")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(subTextColor.opacity(0.6))
                    Spacer()
                } else {
                    ForEach(displayEvents, id: \.id) { (event: SharedEvent) in
                        let colorHex = event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6"
                        
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 4) {
                                RoundedRectangle(cornerRadius: 1.5).fill(Color(hex: colorHex)).frame(width: 3, height: 10)
                                if let start = event.startDate {
                                    let end = event.inclusiveEndDate
                                    let isSameDay = Calendar.current.isDate(start, inSameDayAs: end)
                                    let startDateStr = start.formatted(.dateTime.month(.defaultDigits).day())
                                    let endDateStr = end.formatted(.dateTime.month(.defaultDigits).day())
                                    
                                    if event.extendedProps?.metadata?.isAllDayBackground == true || event.start.count <= 10 {
                                        let text = isSameDay ? "\(startDateStr) 終日" : "\(startDateStr) - \(endDateStr) 終日"
                                        Text(text).font(.system(size: 10, weight: .bold)).foregroundColor(subTextColor).lineLimit(1).minimumScaleFactor(0.8)
                                    } else {
                                        let startStr = start.formatted(.dateTime.hour().minute())
                                        let endTimeStr = end.formatted(.dateTime.hour().minute())
                                        let endSuffix = startStr != endTimeStr ? " - \(endTimeStr)" : ""
                                        let text = isSameDay ? "\(startDateStr) \(startStr)\(endSuffix)" : "\(startDateStr) \(startStr) - \(endDateStr) \(endTimeStr)"
                                        Text(text).font(.system(size: 10, weight: .bold)).foregroundColor(subTextColor).lineLimit(1).minimumScaleFactor(0.8)
                                    }
                                }
                            }
                            // 🌟 修正: 予定が2件ある時はタイトルを優先し、1件のみの時だけ交通機関を表示
                            HStack(alignment: .center, spacing: 4) {
                                Text(event.title).font(.system(size: 13, weight: .heavy)).foregroundColor(textColor).lineLimit(1).padding(.leading, 7)
                                Spacer(minLength: 0)
                                
                                if displayEvents.count == 1 && event.extendedProps?.metadata?.isTransit == true {
                                    let meta = event.extendedProps?.metadata
                                    VStack(alignment: .trailing, spacing: 1.5) {
                                        if let dTime = meta?.transitDepTime, let aTime = meta?.transitArrTime {
                                            let tIcon = meta?.transitType == "plane" ? "airplane" : (meta?.transitType == "bus" ? "bus.fill" : "train.side.front.car")
                                            HStack(spacing: 2) {
                                                Image(systemName: tIcon)
                                                Text("\(dTime)-\(aTime)")
                                                    .monospacedDigit()
                                            }
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(subTextColor.opacity(0.85))
                                            .frame(width: 82)
                                            .padding(.vertical, 1)
                                            .background(Color.gray.opacity(0.15)).cornerRadius(3)
                                        }
                                        if meta?.hasReturnTransit == true, let rdTime = meta?.returnTransitDepTime, let raTime = meta?.returnTransitArrTime {
                                            let rIcon = meta?.returnTransitType == "plane" ? "airplane" : (meta?.returnTransitType == "bus" ? "bus.fill" : "train.side.front.car")
                                            HStack(spacing: 2) {
                                                Image(systemName: rIcon)
                                                Text("\(rdTime)-\(raTime)")
                                                    .monospacedDigit()
                                            }
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(subTextColor.opacity(0.85))
                                            .frame(width: 82)
                                            .padding(.vertical, 1)
                                            .background(Color.gray.opacity(0.15)).cornerRadius(3)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.gray.opacity(0.08))
                        .cornerRadius(12)
                    }
                }
            }
            .padding(.horizontal, 2)
            Spacer(minLength: 0)
        }
        .padding(12)
    }}

// MARK: - 🔒 ロック画面用
struct LockScreenAddShortcutView: View {
    var entry: Provider.Entry
    var body: some View {
        ZStack { Image(systemName: "plus.circle.fill").resizable().scaledToFit().padding(4) }
            .widgetURL(URL(string: "smartlifeos://add-event"))
    }
}

struct LockScreenRectangularView: View {
    var entry: Provider.Entry
    var body: some View {
        let now = Date()
        let nextEvent = entry.events.filter { event in
            let end = event.inclusiveEndDate
            return end > now
        }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }.first
        
        VStack(alignment: .leading) {
            HStack { Image(systemName: "calendar"); Text("次の予定").font(.headline) }
            if let event = nextEvent { Text(event.title).lineLimit(1).font(.body.bold()) }
            else { Text("本日の予定はありません").font(.body) }
        }
    }
}

// MARK: - 🎨 月毎カレンダー (Largeサイズ用)
struct MonthlyCalendarView: View {
    var entry: Provider.Entry
    var textColor: Color
    var subTextColor: Color
    
    var body: some View {
        let calendar = Calendar.current
        let today = entry.date
        
        let components = calendar.dateComponents([.year, .month], from: today)
        let firstDayOfMonth = calendar.date(from: components)!
        let range = calendar.range(of: .day, in: .month, for: firstDayOfMonth)!
        let numDays = range.count
        let firstWeekday = calendar.component(.weekday, from: firstDayOfMonth)
        let rows = 6
        
        VStack(spacing: 8) {
            HStack {
                Text(today, format: .dateTime.year().month())
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(textColor)
                Spacer()
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 4)
            
            let weekdays = ["日", "月", "火", "水", "木", "金", "土"]
            HStack(spacing: 0) {
                ForEach(0..<7, id: \.self) { i in
                    Text(weekdays[i])
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(i == 0 ? .red : (i == 6 ? .blue.opacity(0.8) : subTextColor))
                        .frame(maxWidth: .infinity)
                }
            }
            
            VStack(spacing: 6) {
                ForEach(0..<rows, id: \.self) { row in
                    HStack(spacing: 0) {
                        ForEach(0..<7, id: \.self) { col in
                            let cellIndex = row * 7 + col
                            let dayOffset = cellIndex - (firstWeekday - 1)
                            
                            if dayOffset >= 0 && dayOffset < numDays {
                                let date = calendar.date(byAdding: .day, value: dayOffset, to: firstDayOfMonth)!
                                let isToday = calendar.isDateInToday(date)
                                let isSun = date.isSunday(calendar: calendar) || date.isJapaneseHoliday(calendar: calendar)
                                let isSat = date.isSaturday(calendar: calendar)
                                
                                let dateColor: Color = isToday ? .white : (isSun ? .red : (isSat ? .blue.opacity(0.8) : textColor))
                                
                                let dayEvents = entry.events.filter { event in
                                    event.isIncluded(in: date, calendar: calendar)
                                }.sorted { ($0.startDate ?? Date()) < ($1.startDate ?? Date()) }
                                
                                let allDayEvent = dayEvents.first(where: { ($0.extendedProps?.metadata?.isAllDayBackground == true) || ($0.start.count <= 10) })
                                
                                VStack(spacing: 3) {
                                    ZStack {
                                        if let event = allDayEvent {
                                            let cColor = Color(hex: event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6")
                                            let eStart = calendar.startOfDay(for: event.startDate ?? Date())
                                            let eEnd = calendar.startOfDay(for: event.inclusiveEndDate)
                                            let isStart = calendar.isDate(date, inSameDayAs: eStart)
                                            let isEnd = calendar.isDate(date, inSameDayAs: eEnd)
                                            
                                            EventBandView(isStart: isStart, isEnd: isEnd, color: cColor)
                                                .opacity(0.3)
                                        }
                                        
                                        if isToday {
                                            Circle().fill(Color.blue).frame(width: 24, height: 24)
                                        }
                                        Text("\(dayOffset + 1)")
                                            .font(.system(size: 13, weight: isToday ? .black : .medium))
                                            .foregroundColor(dateColor)
                                    }
                                    .frame(height: 26)
                                    
                                    HStack(spacing: 2) {
                                        let timeEvents = dayEvents.filter { !($0.extendedProps?.metadata?.isAllDayBackground == true || $0.start.count <= 10) }
                                        let topEvents = Array(timeEvents.prefix(3))
                                        
                                        if topEvents.isEmpty {
                                            Circle().fill(Color.clear).frame(width: 4, height: 4)
                                        } else {
                                            ForEach(topEvents, id: \.id) { event in
                                                let colorHex = event.extendedProps?.cColor ?? event.extendedProps?.metadata?.customColor ?? "#3b82f6"
                                                Circle().fill(Color(hex: colorHex)).frame(width: 4, height: 4)
                                            }
                                        }
                                    }
                                    .frame(height: 4)
                                }
                                .padding(.vertical, 4)
                                .frame(maxWidth: .infinity)
                            } else {
                                VStack(spacing: 3) {
                                    Text("").frame(height: 26)
                                    Circle().fill(Color.clear).frame(width: 4, height: 4)
                                }
                                .padding(.vertical, 4)
                                .frame(maxWidth: .infinity)
                            }
                        }
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(10)
    }
}

struct MonthlyCalendarWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.colorScheme) var colorScheme
    
    var textColor: Color { colorScheme == .dark ? Color.white : Color.black }
    var subTextColor: Color { colorScheme == .dark ? Color.gray : Color(white: 0.4) }
    
    var body: some View {
        MonthlyCalendarView(entry: entry, textColor: textColor, subTextColor: subTextColor)
            .widgetURL(URL(string: "smartlifeos://month"))
            .containerBackground(for: .widget) { Color.clear }
    }
}

// MARK: - 🚀 ウィジェット起動エントリーポイント
struct CalendarWidget: Widget {
    let kind: String = "CalendarWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            CalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("SmartLifeOS 日・週カレンダー")
        .description("予定やショートカットを配置できます。")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
    }
}

struct MonthlyCalendarWidget: Widget {
    let kind: String = "MonthlyCalendarWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MonthlyCalendarWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("SmartLifeOS 月毎カレンダー")
        .description("1ヶ月の予定をドットで一覧表示します。")
        .supportedFamilies([.systemLarge])
    }
}

@main
struct SmartLifeOSWidgetBundle: WidgetBundle {
    var body: some Widget {
        CalendarWidget()
        MonthlyCalendarWidget()
    }
}
