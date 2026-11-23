import { describe, expect, it } from 'vitest';

import {
  airQualityLevel,
  formatMicrograms,
  formatPollen,
  formatPressure,
  formatUvIndex,
  formatWindDirection,
} from './windAirFormat';

describe('formatWindDirection', () => {
  it('convierte los grados en puntos cardinales en español', () => {
    expect(formatWindDirection(0)).toBe('N');
    expect(formatWindDirection(45)).toBe('NE');
    expect(formatWindDirection(90)).toBe('E');
    expect(formatWindDirection(180)).toBe('S');
    expect(formatWindDirection(225)).toBe('SO');
    expect(formatWindDirection(270)).toBe('O');
    expect(formatWindDirection(315)).toBe('NO');
  });

  it('agrupa los grados intermedios y trata 360 como norte', () => {
    expect(formatWindDirection(360)).toBe('N');
    expect(formatWindDirection(22)).toBe('N');
    expect(formatWindDirection(23)).toBe('NE');
    expect(formatWindDirection(350)).toBe('N');
    expect(formatWindDirection(-45)).toBe('NO');
  });

  it('muestra un marcador si no hay dato', () => {
    expect(formatWindDirection(null)).toBe('—');
  });
});

describe('formatos de medidas', () => {
  it('formatea la presión, el índice UV y las concentraciones', () => {
    expect(formatPressure(1024.9)).toBe('1025 hPa');
    expect(formatUvIndex(2.45)).toBe('2');
    expect(formatMicrograms(3.34)).toBe('3,3 µg/m³');
    expect(formatMicrograms(0)).toBe('0 µg/m³');
  });

  it('muestra un marcador si falta el dato', () => {
    expect(formatPressure(null)).toBe('—');
    expect(formatUvIndex(null)).toBe('—');
    expect(formatMicrograms(null)).toBe('—');
  });
});

describe('airQualityLevel', () => {
  it('clasifica el índice europeo según sus intervalos', () => {
    expect(airQualityLevel(0)).toEqual({ label: 'Buena', tone: 'good' });
    expect(airQualityLevel(20)).toEqual({ label: 'Buena', tone: 'good' });
    expect(airQualityLevel(22)).toEqual({ label: 'Razonable', tone: 'fair' });
    expect(airQualityLevel(60)).toEqual({ label: 'Moderada', tone: 'moderate' });
    expect(airQualityLevel(61)).toEqual({ label: 'Mala', tone: 'poor' });
    expect(airQualityLevel(100)).toEqual({ label: 'Muy mala', tone: 'very-poor' });
    expect(airQualityLevel(101)).toEqual({ label: 'Extremadamente mala', tone: 'extreme' });
  });

  it('devuelve null si no hay índice', () => {
    expect(airQualityLevel(null)).toBeNull();
  });
});

describe('formatPollen', () => {
  it('muestra un marcador si el proveedor no cubre el polen', () => {
    expect(formatPollen({ olive: null, grass: null })).toBe('—');
  });

  it('indica que no hay polen cuando está a cero (fuera de temporada)', () => {
    expect(formatPollen({ olive: 0, grass: 0 })).toBe('Sin polen');
  });

  it('muestra la especie dominante', () => {
    expect(formatPollen({ olive: 35.4, grass: 4 })).toBe('Olivo 35 gr/m³');
    expect(formatPollen({ olive: 0, grass: 12 })).toBe('Gramíneas 12 gr/m³');
  });

  it('usa la especie con dato si la otra no está disponible', () => {
    expect(formatPollen({ olive: null, grass: 0 })).toBe('Sin polen');
    expect(formatPollen({ olive: null, grass: 7 })).toBe('Gramíneas 7 gr/m³');
  });
});
