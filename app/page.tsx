"use client"
import * as THREE from 'three'
import React, {useRef, useState} from 'react'
import {Canvas, useFrame, ThreeElements} from '@react-three/fiber'
import {OrbitControls} from '@react-three/drei'
import * as topojson from "topojson-client"

function Box(props: ThreeElements['mesh']) {
    const meshRef = useRef<THREE.Mesh>(null!)
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    useFrame((state, delta) => (meshRef.current.rotation.x += delta))
    return (
        <mesh
            {...props}
            ref={meshRef}
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}>
            <boxGeometry args={[1, 1, 1]}/>
            <meshStandardMaterial color={hovered ? 'hotpink' : '#2f74c0'}/>
        </mesh>
    )
}

function convertVertex(radius: number, latitude: number, longitude: number) {
    const lambda = latitude * Math.PI / 180,
        phi = longitude * Math.PI / 180,
        cosPhi = Math.cos(phi);
    return [
        radius * cosPhi * Math.sin(lambda),
        radius * Math.sin(phi),
        radius * cosPhi * Math.cos(lambda),
    ];
}

export default function Home() {
    const [vertex, setVertex] = React.useState<Float32Array>()
    const [indices, setIndices] = React.useState<Uint32Array>()
    React.useEffect(() => {
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
            .then(v => v.json())
            .then(v => {
                console.log(v.objects.countries)
                const x = topojson.mesh(v, v.objects.countries)
                console.log(x)
                const y = x.coordinates.flat()
                console.log(y)
                const z = y.map(v => convertVertex(10, v[0], v[1]))
                console.log(z)
                setVertex(new Float32Array(z.flat()))
                const indices = x.coordinates.map(v => v.length).map((v, i, a) => {
                    const offset = a.slice(0, i).reduce((a, b) => a + b, 0)
                    return [...Array(v - 1)].map((_, i) => [offset + i, offset + i + 1]).flat()
                }).flat()
                setIndices(new Uint32Array(indices))
            })
    }, [])
    //Material with color = 'white' is not white https://github.com/pmndrs/react-three-fiber/discussions/1290#discussioncomment-668649
    //使いたい　https://github.com/spite/THREE.MeshLine?tab=readme-ov-file
    //データだけ引っ張ってblenderでキービジュアルを作ろう
    return (
        <Canvas
            style={{width: "100%", height: "100%"}}
            linear
            flat
            camera={{position: [10, 10, -10]}}
            gl={{antialias: false}}
        >
            <OrbitControls/>
            {vertex && indices &&
                <lineSegments>
                    <bufferGeometry>
                        <bufferAttribute
                            attach='attributes-position'
                            array={vertex}
                            count={vertex.length / 3}
                            itemSize={3}
                        />
                        <bufferAttribute
                            attach='index'
                            array={indices}
                            count={indices.length}
                            itemSize={1}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color={"#ddd"} linewidth={3}/>
                </lineSegments>
            }
            <mesh>
                <sphereGeometry args={[10, 24, 24]}/>
                <meshBasicMaterial color={"white"}/>
            </mesh>
            <ambientLight color={"#ffffff"} intensity={1}/>
            <Box position={[-1.2, 0, 0]}/>
            <Box position={[1.2, 0, 0]}/>
        </Canvas>
    );
}
