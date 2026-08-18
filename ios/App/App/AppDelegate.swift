import UIKit
import Capacitor
import WidgetKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
            
            // 🌟 カレンダーアプリ用の確実な受信アルゴリズム
            if url.scheme == "smartlifeos" && url.host == "widget" {
                let urlString = url.absoluteString
                
                // 文字数が長すぎてURLComponentsが失敗するのを防ぐため、文字列から直接抽出
                if let range = urlString.range(of: "?data=") {
                    let dataString = String(urlString[range.upperBound...])
                    
                    // URLデコード（%22 などを " に戻す）
                    if let jsonString = dataString.removingPercentEncoding {
                        
                        if let sharedDefaults = UserDefaults(suiteName: "group.com.yourname.smartlifeos") {
                            sharedDefaults.set(jsonString, forKey: "widget_events_data")
                            
                            // 🌟 収支アプリで大成功の要だった「即時書き込み」を復活
                            sharedDefaults.synchronize()
                            
                            if #available(iOS 14.0, *) {
                                WidgetCenter.shared.reloadAllTimelines()
                            }
                            print("✅ [Widget Sync] データ保存・即時同期完了")
                        }
                    }
                }
                return true
            }

            return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        }
    
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
}
