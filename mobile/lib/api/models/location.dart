import 'package:flutter/foundation.dart';

@immutable
class AtmosLocation {
  const AtmosLocation({
    required this.lat,
    required this.lon,
    required this.name,
    required this.country,
    this.tag,
  });

  final double lat;
  final double lon;
  final String name;
  final String country;

  /// Optional user-set label — 'home', 'work', or null. The
  /// `saved_locations.tag` column enforces uniqueness per (user, tag).
  final String? tag;

  factory AtmosLocation.fromJson(Map<String, dynamic> j) {
    return AtmosLocation(
      lat: (j['lat'] as num).toDouble(),
      lon: (j['lon'] as num).toDouble(),
      name: j['name'] as String? ?? '',
      country: j['country'] as String? ?? '',
      tag: j['tag'] as String?,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'lat': lat,
        'lon': lon,
        'name': name,
        'country': country,
        if (tag != null) 'tag': tag,
      };

  AtmosLocation copyWith({
    double? lat,
    double? lon,
    String? name,
    String? country,
    Object? tag = _sentinel,
  }) =>
      AtmosLocation(
        lat: lat ?? this.lat,
        lon: lon ?? this.lon,
        name: name ?? this.name,
        country: country ?? this.country,
        tag: identical(tag, _sentinel) ? this.tag : tag as String?,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AtmosLocation && other.lat == lat && other.lon == lon);

  @override
  int get hashCode => Object.hash(lat, lon);

  @override
  String toString() => '$name${country.isNotEmpty ? ', $country' : ''}';
}

const Object _sentinel = Object();
