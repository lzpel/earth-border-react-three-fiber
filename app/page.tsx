"use client"
import React from 'react'
import {Canvas, extend, useFrame} from '@react-three/fiber'
import {MeshLineGeometry, MeshLineMaterial} from 'meshline'
import {OrbitControls} from '@react-three/drei'
import * as topojson from "topojson-client"
import atlas from "world-atlas/countries-50m.json"
import {Vector3, Quaternion, Color} from 'three'
import {GUI} from 'lil-gui'

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
	const [show, setShow] = React.useState<boolean>(true)
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const country = topojson.mesh(atlas, atlas.objects.countries).coordinates
	const country_v = country.map(v => v.map(v => convertVertex(v[0], v[1])))
	const global_v = new Float32Array(country_v.flat(2))
	const indices = country.map(v => v.length).map((v, i, a) => {
		const offset = a.slice(0, i).reduce((a, b) => a + b, 0)
		return [...Array(v - 1)].map((_, i) => [offset + i, offset + i + 1])
	}).flat()
	console.log(JSON.stringify(indices))
	const global_i = new Uint32Array(indices.flat())
	//Material with color = 'white' is not white https://github.com/pmndrs/react-three-fiber/discussions/1290#discussioncomment-668649
	//使いたい　https://github.com/spite/THREE.MeshLine?tab=readme-ov-file
	//データだけ引っ張ってblenderでキービジュアルを作ろう
	const chiangmai = [101.4, 14.73]
	/*
	const meshline=country.map((v, i) =>
		<mesh onPointerOver={console.log} key={i}>
			<meshLineGeometry points={country_v[i].flat()}/>
			<meshLineMaterial color="#ddd" lineWidth={0.002}/>
		</mesh>
	)*/

	React.useEffect(() => {
		const gui = new GUI()
		const x = {
			show: false
		}
		gui.add(x, 'show').onChange(setShow)
		return () => {
			gui.destroy()
		}
	}, [])
	const lineMaterial = <lineBasicMaterial color={"white"} linewidth={2}/>
	const background=new Color("black")
	return (
		<Canvas
			style={{width: "100%", height: "100%"}}
			linear
			flat
			camera={{position: [1, 1, -1], near: 0.001, fov: 90}}
			gl={{antialias: false}}
			scene={{background: background}}
		>
			<OrbitControls target={new Vector3(...convertVertex(chiangmai[0], chiangmai[1]))}/>
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
				faceMaterial={<meshBasicMaterial color={background}/>}
				lineMaterial={lineMaterial}
			/>
			{
				[...Array(show?100:0)].map((_, i) => <Line latitude={chiangmai[0]} longitude={chiangmai[1]} seed={i} key={i}/>)
			}

		</Canvas>
	);
}
const colors = [
	0xed6a5a,
	0xf4f1bb,
	0x9bc1bc,
	0x5ca4a9,
	0xe6ebe0,
	0xf0b67f,
	0xfe5f55,
	0xd6d1b1,
	0xc7efcf,
	0xeef5db,
	0x50514f,
	0xf25f5c,
	0xffe066,
	0x247ba0,
	0x70c1b3
];
const Line = (props: {
	latitude: number,
	longitude: number,
	seed: number,
}) => {
	const x = Math.sin(props.seed * 7), y = Math.cos(props.seed * 13)
	const pos_random = 1
	const from_random = 10
	const pos = convertVertex(props.latitude + pos_random * x, props.longitude + pos_random * y)
	const from = convertVertex(props.latitude + from_random * x, props.longitude + from_random * y)
	console.log(pos, from)
	const rate = [...Array(20)].map((_, i, a) => i / (a.length - 1))
	const color = new Color(colors[Math.floor(Math.random() * colors.length)])
	const h_random = (Math.sin(props.seed * 29) * 0.5 + 0.5) * 0.05
	return <mesh onPointerOver={console.log} key={props.seed}>
		<meshLineGeometry points={rate.map(v => {
			const h = 1 + 4 * v * (1 - v) * h_random
			const r = [0, 1, 2].map(i => (pos[i] * v + from[i] * (1 - v)) * h)
			return r
		})}/>
		<meshLineMaterial color={color} lineWidth={0.0002}/>
	</mesh>
}
const Horizon = (props: {
	radius: number,
	faceMaterial: React.ReactNode,
	lineMaterial: React.ReactNode
	visible?: boolean
}) => {
	const [pos, setPos] = React.useState(new Vector3())
	useFrame((state) => {
		setPos(new Vector3(state.camera.position.x, state.camera.position.y, state.camera.position.z))
	});
	const angle_cos = Math.min(props.radius / pos.length(), 1)
	const angle_sin = Math.sqrt(1 - angle_cos * angle_cos)
	const quaternion = new Quaternion();
	quaternion.setFromUnitVectors(new Vector3(0, 1, 0), pos.normalize().multiplyScalar(-1))
	const circle_vector = [...Array(100)].map((_, i, a) => i / a.length * 2 * Math.PI).map(v => [Math.sin(v), 1, Math.cos(v)])
	const circle_index = circle_vector.map((_, i, a) => [i, (i + 1) % a.length]).flat()
	const circle_index2 = circle_vector.map((_, i, a) => [0, i, (i + 1) % a.length]).slice(1).flat()
	const scale = new Vector3(angle_sin, -angle_cos, angle_sin).multiplyScalar(props.radius)
	return <>
		<mesh quaternion={quaternion} scale={scale.clone().multiplyScalar(props.radius)} visible={props.visible}>
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
		<lineSegments quaternion={quaternion} scale={scale.clone().multiplyScalar(props.radius * 1.001)}
					  visible={props.visible}>
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
		</lineSegments>
	</>
}