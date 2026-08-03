import 'package:http/http.dart' as http;

/// Thin wrapper around package:http that automatically adds the header
/// ngrok requires to skip its free-tier browser-warning interstitial page.
/// Without this, requests made from a real browser (e.g. `flutter run -d
/// chrome`) through an ngrok tunnel can receive an HTML warning page
/// instead of JSON, which looks like a random "FormatException" bug.
/// Harmless to keep even after moving to a permanently hosted backend —
/// the extra header is simply ignored by non-ngrok servers.
class AppHttp {
  static const Map<String, String> _ngrokBypass = {"ngrok-skip-browser-warning": "true"};

  static Future<http.Response> get(Uri url, {Map<String, String>? headers}) {
    return http.get(url, headers: {..._ngrokBypass, ...?headers});
  }

  static Future<http.Response> post(Uri url, {Map<String, String>? headers, Object? body}) {
    return http.post(url, headers: {..._ngrokBypass, ...?headers}, body: body);
  }

  static Future<http.Response> patch(Uri url, {Map<String, String>? headers, Object? body}) {
    return http.patch(url, headers: {..._ngrokBypass, ...?headers}, body: body);
  }

  static Future<http.Response> delete(Uri url, {Map<String, String>? headers}) {
    return http.delete(url, headers: {..._ngrokBypass, ...?headers});
  }
}
