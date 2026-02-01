import React from 'react';
import { render } from '@testing-library/react';
import Domino from '../../components/Domino/Domino';

describe('Domino component', () => {
  test('renders without crashing', () => {
    const { container } = render(<Domino left={3} right={5} width="100px" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('renders with correct width', () => {
    const { container } = render(<Domino left={0} right={0} width="150px" />);
    const domino = container.firstChild as HTMLElement;
    expect(domino.style.width).toBe('150px');
  });

  test('renders with custom margin', () => {
    const { container } = render(<Domino left={1} right={2} width="100px" margin="10px" />);
    const domino = container.firstChild as HTMLElement;
    expect(domino.style.margin).toBe('10px');
  });

  test('renders two halves', () => {
    const { container } = render(<Domino left={6} right={6} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    expect(domino.children.length).toBe(2);
  });

  test('left half has correct background image', () => {
    const { container } = render(<Domino left={7} right={8} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    const leftHalf = domino.children[0] as HTMLElement;
    expect(leftHalf.style.backgroundImage).toContain('domino_half_7.png');
  });

  test('right half has correct background image', () => {
    const { container } = render(<Domino left={7} right={8} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    const rightHalf = domino.children[1] as HTMLElement;
    expect(rightHalf.style.backgroundImage).toContain('domino_half_8.png');
  });

  test('right half is rotated 180 degrees', () => {
    const { container } = render(<Domino left={1} right={2} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    const rightHalf = domino.children[1] as HTMLElement;
    expect(rightHalf.style.transform).toBe('rotate(180deg)');
  });

  test('renders double domino correctly', () => {
    const { container } = render(<Domino left={12} right={12} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    const leftHalf = domino.children[0] as HTMLElement;
    const rightHalf = domino.children[1] as HTMLElement;
    expect(leftHalf.style.backgroundImage).toContain('domino_half_12.png');
    expect(rightHalf.style.backgroundImage).toContain('domino_half_12.png');
  });

  test('renders zero domino correctly', () => {
    const { container } = render(<Domino left={0} right={0} width="100px" />);
    const domino = container.firstChild as HTMLElement;
    const leftHalf = domino.children[0] as HTMLElement;
    expect(leftHalf.style.backgroundImage).toContain('domino_half_0.png');
  });
});
