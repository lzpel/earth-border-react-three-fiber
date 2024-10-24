"use client"
import React from 'react'
import {Canvas} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import Earth from '@/app/Earth'
import convLatLng from "@/function/convLatLng";
import {Color, Vector3} from "three";
import Line from './Line';

export default function Home() {
	const radius = 1
	const tsw = true
	const latlng: [number, number] = [100.602063, 13.862322]
	const camera_pos = new Vector3(...[1, 1, -1].map(v => v * radius))
	return (
		<Canvas
			style={{width: "100%", height: "100%"}}
			linear
			flat
			camera={{position: camera_pos, near: 0.001, fov: 45}}
			scene={tsw ? {background: new Color("#CBC6BF")} : undefined}
			gl={tsw ? svg_gl_hook : {antialias: false}}
		>
			<OrbitControls target={tsw ? new Vector3(...convLatLng(...latlng).map(v => v * radius)) : undefined}/>
			<Earth radius={radius} lineMaterial={<lineBasicMaterial color={tsw ? "#fff" : "#ddd"} linewidth={2}/>}/>
			{
				tsw && <group scale={radius}>
					{[...Array(100)].map((_v, i) => <Line key={i} latitude={latlng[0]} longitude={latlng[1]} seed={i}/>)}
				</group>
			}

		</Canvas>
	);
}
const svg_gl_hook = (canvas: HTMLCanvasElement | OffscreenCanvas) => {
	const gl = new SVGRenderer()
	if ("parentNode" in canvas) {
		const parent = canvas.parentNode
		if (parent) {
			parent.removeChild(canvas)
			parent.appendChild(gl.domElement)
		}
	}
	return gl
}