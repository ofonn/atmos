import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/colors.dart';
import '../theme/typography.dart';

class _NavItem {
  const _NavItem({required this.path, required this.icon, required this.label});
  final String path;
  final IconData icon;
  final String label;
}

const List<_NavItem> _items = <_NavItem>[
  _NavItem(path: '/', icon: LucideIcons.layoutDashboard, label: 'Home'),
  _NavItem(path: '/technical', icon: LucideIcons.barChart2, label: 'Details'),
  _NavItem(path: '/overview', icon: LucideIcons.calendarDays, label: 'Outlook'),
  _NavItem(path: '/trip', icon: LucideIcons.plane, label: 'Trip'),
  _NavItem(path: '/chat', icon: LucideIcons.messageCircle, label: 'Chat'),
  _NavItem(path: '/settings', icon: LucideIcons.settings, label: 'Settings'),
];

class AtmosBottomNav extends StatelessWidget {
  const AtmosBottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final String location = GoRouterState.of(context).uri.path;
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(40),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: t.navBg,
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: t.navBorder, width: 0.5),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: Colors.black.withOpacity(0.25),
                    blurRadius: 32,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: _items.map((_NavItem i) {
                  final bool active = location == i.path;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(40),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        if (!active) context.go(i.path);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: active ? AtmosColors.heroGradient : null,
                                boxShadow: active
                                    ? <BoxShadow>[
                                        BoxShadow(
                                          color: AtmosColors.heroGradientStart.withOpacity(0.4),
                                          blurRadius: 16,
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Icon(
                                i.icon,
                                size: 18,
                                color: active ? Colors.white : t.textMuted.withOpacity(0.5),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              i.label,
                              style: AtmosTypography.label(
                                fontSize: 9,
                                fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                                color: active ? t.primary : t.textMuted.withOpacity(0.5),
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
