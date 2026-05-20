import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../api/models/location.dart';
import '../../state/location_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});
  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  final TextEditingController _search = TextEditingController();
  List<AtmosLocation> _results = const <AtmosLocation>[];
  bool _searching = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _runSearch(String q) async {
    if (q.trim().isEmpty) {
      setState(() => _results = const <AtmosLocation>[]);
      return;
    }
    setState(() => _searching = true);
    final List<AtmosLocation> r = await ref.read(locationProvider.notifier).rawSearch(q);
    if (!mounted) return;
    setState(() {
      _results = r;
      _searching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final LocationState? state = ref.watch(locationProvider).valueOrNull;
    final AtmosLocation? current = state?.current;
    final List<AtmosLocation> saved = state?.saved ?? <AtmosLocation>[];
    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: Column(
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
                  Text('Saved places',
                      style: AtmosTypography.headline(fontSize: 22, fontWeight: FontWeight.w700, color: t.text)),
                  const Spacer(),
                  IconButton(
                    icon: Icon(LucideIcons.plus, color: t.text),
                    onPressed: () => _openSearchSheet(),
                  ),
                ],
              ),
              Expanded(
                child: saved.isEmpty
                    ? _empty()
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                        itemCount: saved.length,
                        itemBuilder: (BuildContext context, int i) =>
                            _card(saved[i], current),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _card(AtmosLocation loc, AtmosLocation? current) {
    final AtmosTokens t = context.atmos;
    final bool isCurrent = current != null && current == loc;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          // Tap = preview (peek without switching primary)
          onTap: () => _showPreview(context, ref, loc),
          // Long-press = set as primary
          onLongPress: () {
            ref.read(locationProvider.notifier).setAsCurrentLocation(loc);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text('Switched to ${loc.name}'),
              duration: const Duration(seconds: 2),
            ));
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isCurrent ? t.primary : t.outline.withOpacity(0.5),
                width: isCurrent ? 1 : 0.5,
              ),
            ),
            child: Row(
              children: <Widget>[
                Icon(LucideIcons.mapPin, color: t.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Flexible(
                            child: Text(loc.name,
                                style: AtmosTypography.headline(
                                    fontSize: 16, fontWeight: FontWeight.w700, color: t.text)),
                          ),
                          if (loc.tag != null) ...<Widget>[
                            const SizedBox(width: 8),
                            _tagChip(t, loc.tag!),
                          ],
                          if (isCurrent) ...<Widget>[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: t.primary,
                                borderRadius: BorderRadius.circular(40),
                              ),
                              child: Text('Current',
                                  style: AtmosTypography.label(
                                      fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ],
                      ),
                      Text(loc.country,
                          style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: Icon(LucideIcons.moreVertical, color: t.textMuted, size: 18),
                  onSelected: (String v) {
                    final n = ref.read(locationProvider.notifier);
                    switch (v) {
                      case 'use':
                        n.setAsCurrentLocation(loc);
                        context.go('/');
                        break;
                      case 'home':
                        n.setTag(loc, 'home');
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${loc.name} tagged as Home'), duration: const Duration(seconds: 2)),
                        );
                        break;
                      case 'work':
                        n.setTag(loc, 'work');
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('${loc.name} tagged as Work'), duration: const Duration(seconds: 2)),
                        );
                        break;
                      case 'clear':
                        n.setTag(loc, null);
                        break;
                      case 'delete':
                        n.removeLocation(loc);
                        ScaffoldMessenger.of(context)
                          ..hideCurrentSnackBar()
                          ..showSnackBar(SnackBar(
                            content: Text('Removed ${loc.name}'),
                            duration: const Duration(seconds: 5),
                            action: SnackBarAction(
                              label: 'Undo',
                              onPressed: () => n.saveLocation(loc),
                            ),
                          ));
                        break;
                    }
                  },
                  itemBuilder: (BuildContext _) => <PopupMenuEntry<String>>[
                    const PopupMenuItem<String>(value: 'use', child: Text('Set as current')),
                    PopupMenuItem<String>(
                      value: 'home',
                      child: Text(loc.tag == 'home' ? '✓ Tagged as Home' : 'Tag as Home'),
                    ),
                    PopupMenuItem<String>(
                      value: 'work',
                      child: Text(loc.tag == 'work' ? '✓ Tagged as Work' : 'Tag as Work'),
                    ),
                    if (loc.tag != null)
                      const PopupMenuItem<String>(value: 'clear', child: Text('Clear tag')),
                    const PopupMenuDivider(),
                    const PopupMenuItem<String>(
                      value: 'delete',
                      child: Text('Delete', style: TextStyle(color: Colors.redAccent)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _empty() {
    final AtmosTokens t = context.atmos;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(LucideIcons.mapPin, size: 48, color: t.primary.withOpacity(0.6)),
          const SizedBox(height: 12),
          Text('No saved places yet', style: AtmosTypography.headline(fontSize: 18, fontWeight: FontWeight.w600, color: t.text)),
          const SizedBox(height: 6),
          Text('Add a city to switch quickly between locations.',
              style: AtmosTypography.body(fontSize: 13, color: t.textMuted)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _openSearchSheet,
            icon: const Icon(LucideIcons.plus),
            label: const Text('Add location'),
            style: FilledButton.styleFrom(backgroundColor: t.primary, foregroundColor: Colors.white),
          ),
        ],
      ),
    );
  }

  void _openSearchSheet() {
    final AtmosTokens t = context.atmos;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: t.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext ctx) => StatefulBuilder(
        builder: (BuildContext ctx, void Function(void Function()) setSheet) {
          return Padding(
            padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(ctx).viewInsets.bottom + 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text('Find a city',
                    style: AtmosTypography.headline(
                        fontSize: 18, fontWeight: FontWeight.w700, color: t.text)),
                const SizedBox(height: 12),
                TextField(
                  controller: _search,
                  autofocus: true,
                  style: TextStyle(color: t.text),
                  decoration: InputDecoration(
                    hintText: 'City name…',
                    hintStyle: TextStyle(color: t.textMuted),
                    filled: true,
                    fillColor: t.surfaceMid,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    prefixIcon: Icon(LucideIcons.search, color: t.textMuted),
                  ),
                  onChanged: (String v) async {
                    await _runSearch(v);
                    setSheet(() {});
                  },
                ),
                const SizedBox(height: 12),
                ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.5),
                  child: _searching
                      ? const Padding(
                          padding: EdgeInsets.all(16),
                          child: CircularProgressIndicator(),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          itemCount: _results.length,
                          itemBuilder: (BuildContext _, int i) {
                            final AtmosLocation r = _results[i];
                            return ListTile(
                              leading: Icon(LucideIcons.mapPin, color: t.primary),
                              title: Text('${r.name}, ${r.country}',
                                  style: TextStyle(color: t.text)),
                              trailing: TextButton(
                                onPressed: () {
                                  ref.read(locationProvider.notifier).setAsCurrentLocation(r);
                                  Navigator.pop(ctx);
                                  context.go('/');
                                },
                                child: const Text('Switch'),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Compact chip rendered next to the city name when a tag is set.
  Widget _tagChip(AtmosTokens t, String tag) {
    final IconData icon = tag == 'home'
        ? LucideIcons.home
        : tag == 'work'
            ? LucideIcons.briefcase
            : LucideIcons.tag;
    final String label = tag[0].toUpperCase() + tag.substring(1);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: t.surfaceMid,
        borderRadius: BorderRadius.circular(40),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 10, color: t.primary),
          const SizedBox(width: 4),
          Text(label,
              style: AtmosTypography.label(
                  fontSize: 9, color: t.textMuted, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  /// Read-only "peek" — tap a card to see brief weather without
  /// switching the primary location. Long-press still switches.
  void _showPreview(BuildContext context, WidgetRef ref, AtmosLocation loc) {
    final AtmosTokens t = context.atmos;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: false,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) {
        return Container(
          decoration: BoxDecoration(
            color: t.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: t.outline.withOpacity(0.5)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Center(
                  child: Container(
                    width: 40,
                    height: 5,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: t.textMuted.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(40),
                    ),
                  ),
                ),
                Text(loc.name,
                    style: AtmosTypography.headline(
                        fontSize: 22, fontWeight: FontWeight.w700, color: t.text)),
                if (loc.country.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(loc.country,
                        style: AtmosTypography.label(fontSize: 12, color: t.textMuted)),
                  ),
                const SizedBox(height: 12),
                Text(
                  'Coords: ${loc.lat.toStringAsFixed(3)}, ${loc.lon.toStringAsFixed(3)}',
                  style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
                ),
                const SizedBox(height: 16),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: t.text,
                          side: BorderSide(color: t.outline),
                        ),
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Close'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: t.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () {
                          ref.read(locationProvider.notifier).setAsCurrentLocation(loc);
                          Navigator.pop(ctx);
                          context.go('/');
                        },
                        child: const Text('Set as current'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
