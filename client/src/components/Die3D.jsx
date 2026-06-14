import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Builds the geometry for a given die type. d4/d6/d8/d12/d20 use three.js
// built-in polyhedra; d10/d100 use a custom pentagonal bipyramid that reads as
// the classic ten-sided die.
function makeGeometry(type) {
  switch (type) {
    case 'd4':
      return new THREE.TetrahedronGeometry(1.05);
    case 'd6':
      return new THREE.BoxGeometry(1.4, 1.4, 1.4);
    case 'd8':
      return new THREE.OctahedronGeometry(1.15);
    case 'd12':
      return new THREE.DodecahedronGeometry(1.1);
    case 'd20':
      return new THREE.IcosahedronGeometry(1.15);
    case 'd10':
    case 'd100':
      return pentagonalBipyramid(1.0, 1.25);
    default:
      return new THREE.IcosahedronGeometry(1.15);
  }
}

// A 5-sided bipyramid (two pyramids joined at a pentagon) — a good stand-in for
// a real d10's pentagonal-trapezohedron silhouette.
function pentagonalBipyramid(radius, height) {
  const verts = [];
  const ring = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ring.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
  }
  const top = [0, height, 0];
  const bottom = [0, -height, 0];
  const pos = [];
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    // top face
    pos.push(...top, ...ring[i], ...ring[next]);
    // bottom face (reverse winding)
    pos.push(...bottom, ...ring[next], ...ring[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// A single 3D die that idly turns and, when `rollKey` changes, tumbles fast
// and settles. Calls onSettle() when the tumble finishes.
export default function Die3D({ type = 'd20', color = '#7b5cff', rollKey = 0, onSettle }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // One-time three.js setup.
  useEffect(() => {
    const mount = mountRef.current;
    const size = 150;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9a8cff, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    const st = stateRef.current;
    st.scene = scene;
    st.camera = camera;
    st.renderer = renderer;
    st.velocity = { x: 0.25, y: 0.4, z: 0.1 }; // gentle idle spin
    st.settleTimer = null;
    st.mesh = null;
    st.edges = null;

    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const m = st.mesh;
      if (m) {
        m.rotation.x += st.velocity.x * dt;
        m.rotation.y += st.velocity.y * dt;
        m.rotation.z += st.velocity.z * dt;
        // Damp toward the gentle idle spin.
        const damp = Math.pow(0.12, dt);
        st.velocity.x = 0.25 + (st.velocity.x - 0.25) * damp;
        st.velocity.y = 0.4 + (st.velocity.y - 0.4) * damp;
        st.velocity.z = 0.1 + (st.velocity.z - 0.1) * damp;
        if (st.edges) st.edges.rotation.copy(m.rotation);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    st.raf = raf;

    return () => {
      cancelAnimationFrame(st.raf);
      if (st.settleTimer) clearTimeout(st.settleTimer);
      renderer.dispose();
      if (st.mesh) st.mesh.geometry.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Rebuild the mesh when the die type or color changes.
  useEffect(() => {
    const st = stateRef.current;
    if (!st.scene) return;
    if (st.mesh) {
      st.scene.remove(st.mesh);
      st.mesh.geometry.dispose();
      st.mesh.material.dispose();
    }
    if (st.edges) {
      st.scene.remove(st.edges);
      st.edges.geometry.dispose();
      st.edges.material.dispose();
    }
    const geo = makeGeometry(type);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.35,
      roughness: 0.35,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    st.scene.add(mesh);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 1),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
    );
    st.scene.add(edges);
    st.mesh = mesh;
    st.edges = edges;
  }, [type, color]);

  // Kick off a tumble whenever rollKey changes.
  useEffect(() => {
    if (rollKey === 0) return;
    const st = stateRef.current;
    const rand = () => (Math.random() * 2 - 1) * (10 + Math.random() * 8);
    st.velocity = { x: rand(), y: rand(), z: rand() };
    if (st.settleTimer) clearTimeout(st.settleTimer);
    st.settleTimer = setTimeout(() => {
      if (onSettle) onSettle();
    }, 1100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollKey]);

  return <div className="die3d" ref={mountRef} />;
}
