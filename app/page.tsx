"use client"
import React from 'react'
import {Canvas, extend} from '@react-three/fiber'
import {MeshLineGeometry, MeshLineMaterial} from 'meshline'
import {OrbitControls} from '@react-three/drei'
import * as topojson from "topojson-client"
import atlas from "world-atlas/countries-50m.json"
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import { Vector3 } from 'three'

extend({MeshLineGeometry, MeshLineMaterial})

function convertVertex(latitude: number, longitude: number) {
	const lambda = latitude * Math.PI / 180, phi = longitude * Math.PI / 180
	return [
		Math.cos(phi) * Math.sin(lambda),
		Math.sin(phi),
		Math.cos(phi) * Math.cos(lambda),
	];
}

export default function Home() {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const country = topojson.mesh(atlas, atlas.objects.countries).coordinates
	const country_v = country.map(v => v.map(v => convertVertex(v[0], v[1])))
	const global_v = new Float32Array(country_v.flat(2))
	const indices = country.map(v => v.length).map((v, i, a) => {
		const offset = a.slice(0, i).reduce((a, b) => a + b, 0)
		return [...Array(v - 1)].map((_, i) => [offset + i, offset + i + 1])
	}).flat()
	const global_i = new Uint32Array(indices.flat())
	//Material with color = 'white' is not white https://github.com/pmndrs/react-three-fiber/discussions/1290#discussioncomment-668649
	//使いたい　https://github.com/spite/THREE.MeshLine?tab=readme-ov-file
	//データだけ引っ張ってblenderでキービジュアルを作ろう
	const chiangmai = false
	/*
	const meshline=country.map((v, i) =>
		<mesh onPointerOver={console.log} key={i}>
			<meshLineGeometry points={country_v[i].flat()}/>
			<meshLineMaterial color="#ddd" lineWidth={0.002}/>
		</mesh>
	)*/
	const lineMaterial = <lineBasicMaterial color={"#ddd"} linewidth={2}/>
	return (
		<Canvas
			style={{width: "100%", height: "100%"}}
			linear
			flat
			camera={{position: [1, 1, -1], near: 0.001, fov: 90}}
			gl={chiangmai ? ((canvas) => {
				const gl = new SVGRenderer()
				if ("parentNode" in canvas) {
					const parent = canvas.parentNode
					if (parent) {
						parent.removeChild(canvas)
						parent.appendChild(gl.domElement)
					}
				}
				return gl
			}) : {antialias: false}}
		>
			<OrbitControls target={true ? new Vector3(...convertVertex(98.98, 18.73)):undefined}/>
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
				{lineMaterial}
			</lineSegments>
			<Horizon
				radius={1}
				faceMaterial={<meshBasicMaterial color={"white"} side={2}/>}
				lineMaterial={lineMaterial}
			/>
		</Canvas>
	);
}
//EX,EY,EZは直行していないので若干歪むのかも
//グランシュミットの直交化などでどうにかするか？
//(X-O).xyz=PV*vec4(0.01, 0.0, 0.0, 0.0)で元の位置の情報が消えている
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vertexShader=`void main() {
	vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    mat4 PV = projectionMatrix * viewMatrix;
    vec4 X = PV * vec4(0.01, 0.0, 0.0, 1.0);
    vec4 Y = PV * vec4(0.0, 0.01, 0.0, 1.0);
    vec4 Z = PV * vec4(0.0, 0.0, 0.01, 1.0);
    vec4 O = PV * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 EX = normalize((X-O).xyz);
    vec3 EY = normalize((Y-O).xyz);
    vec3 EZ = normalize((Z-O).xyz);
    mat4 R=transpose(mat4(
        vec4(EX, 0.0),
        vec4(EY, 0.0),
        vec4(EZ, 0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    ));
	gl_Position = PV * R * modelPosition;
}`
//直交化と投影に含まれる回転も含めて上手くいっている感がある
//ただ四次元行列の逆行列の計算コストがきになる
const vertexShader2=`void main() {
	vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    mat4 PV = projectionMatrix * viewMatrix;
    mat4 IPV = inverse(PV);
    vec3 EZ = normalize((IPV * vec4(0,0,1,0)).xyz);
    vec3 EY_ = (IPV * vec4(0,1,0,0)).xyz;
    vec3 EY = normalize(EY_ - dot(EY_, EZ)*EZ);
    vec3 EX = cross(EZ, EY);
    mat4 R = mat4(mat3(EX,EY,EZ));
	gl_Position = PV * R * modelPosition;
}`
const Horizon = (props: {
	radius: number,
	faceMaterial: React.ReactNode,
	lineMaterial: React.ReactNode
}) => {
	const circle_vector=[...Array(100)].map((_,i,a)=>i/a.length*2*Math.PI).map(v=>[Math.cos(v), Math.sin(v), -1])
	const circle_index=circle_vector.map((_,i,a)=>[i,(i+1)%a.length]).flat()
	const circle_index2=circle_vector.map((_,i,a)=>[0,i,(i+1)%a.length]).slice(1).flat()
	return <>
		<mesh>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					array={new Float32Array(circle_vector.flat())}
					count={circle_vector.length}
					itemSize={3}
				/>
				<bufferAttribute
					attach='index'
					array={new Uint32Array(circle_index2)}
					count={circle_index2.length}
					itemSize={1}
				/>
			</bufferGeometry>
			{props.faceMaterial}
		</mesh>
		<lineSegments>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					array={new Float32Array(circle_vector.flat())}
					count={circle_vector.length}
					itemSize={3}
				/>
				<bufferAttribute
					attach='index'
					array={new Uint32Array(circle_index)}
					count={circle_index.length}
					itemSize={1}
				/>
			</bufferGeometry>
			{props.lineMaterial}
			<shaderMaterial vertexShader={vertexShader2}/>
		</lineSegments>
	</>
}