import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens/chat/chat_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/insight/insight_screen.dart';
import 'screens/locations/locations_screen.dart';
import 'screens/overview/overview_screen.dart';
import 'screens/radar/radar_screen.dart';
import 'screens/settings/settings_screen.dart';
import 'screens/technical/technical_screen.dart';
import 'state/settings_provider.dart';
import 'state/storage.dart';
import 'theme/app_theme.dart';
import 'widgets/bottom_nav.dart';

class AtmosApp extends ConsumerStatefulWidget {
  const AtmosApp({super.key});

  @override
  ConsumerState<AtmosApp> createState() => _AtmosAppState();
}

class _AtmosAppState extends ConsumerState<AtmosApp> {
  SharedPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((SharedPreferences p) {
      setState(() => _prefs = p);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_prefs == null) {
      return MaterialApp(
        theme: AtmosTheme.dark(),
        home: const Scaffold(body: SizedBox.shrink()),
      );
    }
    return ProviderScope(
      parent: ProviderScope.containerOf(context, listen: false),
      overrides: <Override>[
        sharedPrefsProvider.overrideWithValue(_prefs!),
      ],
      child: const _RoutedApp(),
    );
  }
}

class _RoutedApp extends ConsumerWidget {
  const _RoutedApp();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ThemeMode mode = ref.watch(settingsProvider.select((AtmosSettings s) => s.themeMode));
    final GoRouter router = _router();
    return MaterialApp.router(
      title: 'Atmos',
      debugShowCheckedModeBanner: false,
      theme: AtmosTheme.light(),
      darkTheme: AtmosTheme.dark(),
      themeMode: mode,
      routerConfig: router,
    );
  }

  GoRouter _router() {
    return GoRouter(
      initialLocation: '/',
      routes: <RouteBase>[
        ShellRoute(
          builder: (BuildContext context, GoRouterState state, Widget child) {
            return _NavShell(child: child);
          },
          routes: <RouteBase>[
            GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
            GoRoute(path: '/technical', builder: (_, __) => const TechnicalScreen()),
            GoRoute(path: '/overview', builder: (_, __) => const OverviewScreen()),
            GoRoute(path: '/chat', builder: (_, __) => const ChatScreen()),
            GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
            GoRoute(path: '/locations', builder: (_, __) => const LocationsScreen()),
            GoRoute(path: '/insight', builder: (_, __) => const InsightScreen()),
            GoRoute(path: '/radar', builder: (_, __) => const RadarScreen()),
          ],
        ),
      ],
    );
  }
}

class _NavShell extends StatelessWidget {
  const _NavShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        Positioned.fill(child: child),
        Positioned(left: 0, right: 0, bottom: 0, child: const AtmosBottomNav()),
      ],
    );
  }
}
