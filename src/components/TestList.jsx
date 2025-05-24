import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function TestList({ tests, exportTestsToCSV }) {
  return (
    <div>
      <h3>Tests realizados: {tests.length}</h3>
      <button onClick={() => exportTestsToCSV(tests)} disabled={!tests.length}>Exportar tests a CSV</button>
      {tests.map((test, idx) => (
        <div key={idx} style={{marginBottom: 10}}>
          <strong>Test #{idx + 1} ({test.tipo || 'desconocido'}):</strong>
          {test.tipo === 'Valkyria Platform' ? (
            <>
              <br/>
              <em>Canal 1:</em> {test.valores.map((v, i) => v.fuerza1 !== undefined ? `${v.fuerza1?.toFixed(2)} (t: ${v.timestampStr || v.timestamp})` : '').join(', ')}<br/>
              <em>Canal 2:</em> {test.valores.map((v, i) => v.fuerza2 !== undefined ? `${v.fuerza2?.toFixed(2)} (t: ${v.timestampStr || v.timestamp})` : '').join(', ')}<br/>
            </>
          ) : test.tipo === 'Valkyria Free Charge 5' ? (
            <>
              <em>Distancias:</em> {test.valores.map((v, i) => v?.valor !== undefined ? `${v.valor.toFixed(2)} (t: ${v.timestampStr || v.timestamp})` : v).join(', ')}<br/>
            </>
          ) : test.tipo === 'Valkyria Dynamometer' ? (
            <>
              <em>Fuerzas:</em> {test.valores.map((v, i) => v?.valor !== undefined ? `${v.valor.toFixed(2)} (t: ${v.timestampStr || v.timestamp})` : v).join(', ')}<br/>
            </>
          ) : (
            <>
              {test.valores.map((v, i) => typeof v === 'object' ? JSON.stringify(v) : v).join(', ')}<br/>
            </>
          )}
          <em>Nombre/Nota:</em> {test.nombre || '(sin nombre)'}
          <ResponsiveContainer width="100%" height={120}>
            {test.tipo === 'Valkyria Platform' ? (
              <LineChart data={test.valores.map((v, i) => ({ muestra: i + 1, fuerza1: v.fuerza1, fuerza2: v.fuerza2 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="muestra" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Fuerza', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fuerza1" stroke="#82ca9d" name="Canal 1" />
                <Line type="monotone" dataKey="fuerza2" stroke="#8884d8" name="Canal 2" />
              </LineChart>
            ) : test.tipo === 'Valkyria Free Charge 5' ? (
              <LineChart data={test.valores.map((v, i) => ({ muestra: i + 1, distancia: v.valor }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="muestra" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Distancia', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="distancia" stroke="#ff7300" name="Distancia" />
              </LineChart>
            ) : test.tipo === 'Valkyria Dynamometer' ? (
              <LineChart data={test.valores.map((v, i) => ({ muestra: i + 1, valor: v.valor }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="muestra" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Fuerza', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#82ca9d" name="Fuerza" />
              </LineChart>
            ) : null}
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
} 