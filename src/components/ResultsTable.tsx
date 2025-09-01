import React from 'react';
import { SegmentResult, ReferenceResult } from '../types/handrail';

interface ResultsTableProps {
  title: string;
  data: SegmentResult[] | ReferenceResult[];
  type: 'segments' | 'reference';
}

export function ResultsTable({ title, data, type }: ResultsTableProps) {
  if (data.length === 0) return null;

  const getRowClass = (section: string) => {
    if (section.includes('Over-Ease')) return 'bg-yellow-100 text-yellow-900 font-semibold';
    if (section.includes('Up-Ease')) return 'bg-red-100 text-red-900 font-semibold';
    return 'bg-blue-100 text-blue-900 font-semibold';
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg border-l-4 border-green-500 overflow-x-auto">
      <h3 className="text-green-800 text-xl font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              {type === 'segments' ? (
                <>
                  <th className="p-2 text-center font-semibold text-xs">Segment</th>
                  <th className="p-2 text-center font-semibold text-xs">Section</th>
                  <th className="p-2 text-center font-semibold text-xs">Angle (°)</th>
                  <th className="p-2 text-center font-semibold text-xs">Arc Distance (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">Rise (in)</th>
                </>
              ) : (
                <>
                  <th className="p-2 text-center font-semibold text-xs">Arc Distance (in)</th>
                  <th className="p-2 text-center font-semibold text-xs">Section</th>
                  <th className="p-2 text-center font-semibold text-xs">Angle (°)</th>
                  <th className="p-2 text-center font-semibold text-xs">Rise (in)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={getRowClass(row.section)}>
                {type === 'segments' ? (
                  <>
                    <td className="p-2 text-center text-xs border-b border-gray-200">
                      <strong>{(row as SegmentResult).segment}</strong>
                    </td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">
                      <strong>{row.section}</strong>
                    </td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{row.angle}°</td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{(row as SegmentResult).arcDistance}"</td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{row.rise}"</td>
                  </>
                ) : (
                  <>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{(row as ReferenceResult).arcDistance}"</td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">
                      <strong>{row.section}</strong>
                    </td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{row.angle}°</td>
                    <td className="p-2 text-center text-xs border-b border-gray-200">{row.rise}"</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}