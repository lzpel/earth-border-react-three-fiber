"use client"
import * as THREE from 'three'
import React from 'react'
import {Canvas, extend} from '@react-three/fiber'
import {MeshLineGeometry, MeshLineMaterial} from 'meshline'
import {OrbitControls} from '@react-three/drei'
import * as topojson from "topojson-client"
import atlas from "world-atlas/countries-50m.json"
import {Vector3} from "three";

extend({MeshLineGeometry, MeshLineMaterial})

function convertVertex(latitude: number, longitude: number) {
	const lambda = latitude * Math.PI / 180,
		phi = longitude * Math.PI / 180,
		cosPhi = Math.cos(phi);
	return [
		cosPhi * Math.sin(lambda),
		Math.sin(phi),
		cosPhi * Math.cos(lambda),
	];
}
const fragmentShader = `
attribute vec3 position;
attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float width;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 resolution;
varying vec2 vUV;

void main() {
    vec4 finalPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 prevPos = projectionMatrix * modelViewMatrix * vec4(previous, 1.0);
    vec4 nextPos = projectionMatrix * modelViewMatrix * vec4(next, 1.0);

    vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
    vec2 prevScreen = prevPos.xy / prevPos.w * aspect;
    vec2 nextScreen = nextPos.xy / nextPos.w * aspect;
    vec2 currentScreen = finalPosition.xy / finalPosition.w * aspect;

    vec2 dir = normalize(nextScreen - prevScreen);
    vec2 normal = vec2(-dir.y, dir.x);
    normal /= aspect;

    float pixelWidth = width / resolution.y;
    vec2 offset = normal * side * pixelWidth;

    finalPosition.xy += offset * finalPosition.w;
    vUV = uv;
    gl_Position = finalPosition;
}
`;

export default function Home() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
    const country = topojson.mesh(atlas, atlas.objects.countries).coordinates
	const country_v = country.map(v => v.map(v => convertVertex(v[0], v[1])))
	const global_v=new Float32Array(country_v.flat(2))
	const indices = country.map(v => v.length).map((v, i, a) => {
		const offset = a.slice(0, i).reduce((a, b) => a + b, 0)
		return [...Array(v - 1)].map((_, i) => [offset + i, offset + i + 1])
	}).flat()
	console.log(JSON.stringify(indices))
	const global_i=new Uint32Array(indices.flat())
	//Material with color = 'white' is not white https://github.com/pmndrs/react-three-fiber/discussions/1290#discussioncomment-668649
	//使いたい　https://github.com/spite/THREE.MeshLine?tab=readme-ov-file
	//データだけ引っ張ってblenderでキービジュアルを作ろう
	const chiangmai=new Vector3(...convertVertex(98.98, 18.73))
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const meshline=country.map((v, i) =>
		<mesh onPointerOver={console.log} key={i}>
			<meshLineGeometry points={country_v[i].flat()}/>
			<meshLineMaterial color="#ddd" lineWidth={0.002}/>
		</mesh>
	)
	return (
		<Canvas
			style={{width: "100%", height: "100%"}}
			linear
			flat
			camera={{position: [1,1,-1], near: 0.01}}
			gl={{antialias: false}}
		>
			<OrbitControls target={chiangmai}/>
			<lineSegments scale={1}>
				<bufferGeometry>
					<bufferAttribute
						attach='attributes-position'
						array={global_v}
						count={global_v.length / 3}
						itemSize={3}
					/>
					<bufferAttribute
						attach='index'
						array={global_i}
						count={global_i.length}
						itemSize={1}
					/>
				</bufferGeometry>
				<lineBasicMaterial color={"#ddd"} linewidth={3}/>
				<shaderMaterial vertexShader={fragmentShader}/>
			</lineSegments>
			<mesh>
				<sphereGeometry args={[1, 24, 24]}/>
				<meshBasicMaterial color={"white"}/>
			</mesh>
			<mesh>
				<sphereGeometry args={[-1.001, 24, 24]}/>
				<meshBasicMaterial color={"#ddd"}/>
			</mesh>
			<ambientLight color={"#ffffff"} intensity={1}/>
		</Canvas>
	);
}
