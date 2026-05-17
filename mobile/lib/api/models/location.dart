import 'package:flutter/foundation.dart';

@immutable
class AtmosLocation {
  const AtmosLocation({
    required this.lat,
    required this.lon,
    required this.name,
    required this.country,
  });

  final double lat;
  final double lon;
  final String name;
  final String country;

  factory AtmosLocation.fromJson(Map<String, dynamic> j) {
    return AtmosLocation(
      lat: (j['lat'] as num).toDouble(),
      lon: (j['lon'] as num).toDouble(),
      name: j['name'] as String? ?? '',
      country: j['country'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'lat': lat,
        'lon': lon,
        'name': name,
        'country': country,
      };

  AtmosLocation copyWith({double? lat, double? lon, String? name, String? country}) =>
      AtmosLocation(
        lat: lat ?? this.lat,
        lon: lon ?? this.lon,
        name: name ?? this.name,
        country: country ?? this.country,
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
