import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { MediaCard } from './components/media/MediaCard';
import Welcome from './pages/public/Welcome';

describe('UI Primitives Quality Assurance', () => {
  describe('Button Component', () => {
    it('QA-UI-BTN-01: Renders children and handles click event', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Play Now</Button>);

      const btn = screen.getByRole('button', { name: /Play Now/i });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('QA-UI-BTN-02: Respects disabled state and ignores clicks', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);

      const btn = screen.getByRole('button', { name: /Disabled Button/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('QA-UI-BTN-03: Applies variant classes properly', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button').className).toContain('bg-apple-blue');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button').className).toContain('bg-apple-gray');
    });
  });

  describe('Input Component', () => {
    it('QA-UI-INP-01: Renders text input and receives user input', () => {
      const handleChange = vi.fn();
      render(<Input placeholder="Search media..." onChange={handleChange} />);

      const input = screen.getByPlaceholderText(/Search media\.\.\./i);
      expect(input).toBeDefined();
      fireEvent.change(input, { target: { value: 'Interstellar' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('QA-UI-INP-02: Displays validation error message when error prop is present', () => {
      render(<Input placeholder="Email" error="Invalid email address" />);
      expect(screen.getByText('Invalid email address')).toBeDefined();
    });

    it('QA-UI-INP-03: Toggles password visibility when type is password', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password') as HTMLInputElement;
      expect(input.type).toBe('password');

      const toggleBtn = screen.getByRole('button');
      fireEvent.click(toggleBtn);
      expect(input.type).toBe('text');

      fireEvent.click(toggleBtn);
      expect(input.type).toBe('password');
    });
  });

  describe('MediaCard Component', () => {
    it('QA-UI-CARD-01: Renders fallback filename when no poster is available', () => {
      const sampleItem = {
        _id: 'media_101',
        title: 'Blade Runner 2049',
        filename: 'Blade.Runner.2049.mp4',
        mediaType: 'movie' as const,
      };

      render(
        <MemoryRouter>
          <MediaCard item={sampleItem} />
        </MemoryRouter>
      );

      expect(screen.getByText('Blade.Runner.2049.mp4')).toBeDefined();
    });

    it('QA-UI-CARD-02: Renders poster image with title as alt text when poster is present', () => {
      const sampleItemWithPoster = {
        _id: 'media_102',
        title: 'Interstellar',
        filename: 'Interstellar.2014.mp4',
        posterPath: '/gEU2QniE6EwfVDxCzsxPnO26Nmn.jpg',
        mediaType: 'movie' as const,
      };

      render(
        <MemoryRouter>
          <MediaCard item={sampleItemWithPoster} />
        </MemoryRouter>
      );

      expect(screen.getByAltText('Interstellar')).toBeDefined();
    });
  });

  describe('Welcome Landing Page', () => {
    it('QA-PAGE-WELC-01: Renders Cineora branding, hero title, and auth action links', () => {
      render(
        <MemoryRouter>
          <Welcome />
        </MemoryRouter>
      );

      expect(screen.getAllByText('Cineora').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Your Media')).toBeDefined();
      expect(screen.getByText('Unleashed')).toBeDefined();
      expect(screen.getAllByRole('link', { name: /Sign In/i }).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: /Get Started/i })).toBeDefined();
    });
  });
});
