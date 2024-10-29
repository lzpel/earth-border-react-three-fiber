import * as topojson from "topojson-client";
import countries50m from "world-atlas/countries-50m.json";
import land50m from "world-atlas/land-50m.json";

type GroupedLatlng = [number, number][][]

function Q(value: number, range_input: number, range_output: number) {
	return Math.floor(Math.max(0, Math.min(1, value / range_input + 0.5)) * range_output)
}

export function quantization(x: GroupedLatlng): GroupedLatlng {
	return x.map(y => y.map(latlng => [Q(latlng[0], 360, 0xffff), Q(latlng[1], 180, 0xffff)]))
}

export default function coordinates(mode: "countries" | "land"): GroupedLatlng {
	if (mode === "countries") {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return topojson.mesh(countries50m, countries50m.objects.countries).coordinates
	} else {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return topojson.mesh(land50m, land50m.objects.land).coordinates
	}
}