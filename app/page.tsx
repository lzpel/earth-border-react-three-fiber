"use client"
import React from 'react'
import {Color, Vector3} from "three";
import {Canvas} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import Earth from '@/app/Earth'
import convLatLng from "@/function/convLatLng";
import Line from '@/app/Line';
import glSVGRenderer from "@/function/glSVGRenderer";

export default function Home() {
	const radius = 1
	const tsw = false
	const latlng: [number, number] = [100.602063, 13.862322]
	const camera_pos = new Vector3(...[1, 1, -1].map(v => v * radius * 2))
	const lines = <group scale={radius}>
		{[...Array(100)].map((_v, i) => <Line key={i} latitude={latlng[0]} longitude={latlng[1]} seed={i}/>)}
	</group>
	return (
		<Canvas
			style={{width: "100%", height: "100%"}}
			linear
			flat
			camera={{position: camera_pos, near: 0.001, fov: 45}}
			scene={tsw ? {background: new Color("#CBC6BF")} : undefined}
			gl={tsw ? glSVGRenderer : {antialias: false}}
		>
			<OrbitControls target={tsw ? new Vector3(...convLatLng(...latlng).map(v => v * radius)) : undefined}/>
			<Earth radius={radius} lineMaterial={<lineBasicMaterial color={tsw ? "#fff" : "#ddd"} linewidth={2}/>}/>
			{tsw && lines}
		</Canvas>
	);
}