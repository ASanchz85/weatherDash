import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ROTATION_FADE_MS } from '../../config';
import { VideoSlide } from './VideoSlide';

describe('VideoSlide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function renderSlide(onFinished = vi.fn()) {
    const { container } = render(<VideoSlide src="/intro.mp4" onFinished={onFinished} />);
    return { video: container.querySelector('video')!, onFinished };
  }

  it('no tiene controles ni sonido', () => {
    const { video } = renderSlide();

    expect(video.controls).toBe(false);
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(false);
    expect(video).toHaveAttribute('src', '/intro.mp4');
  });

  it('empieza a reproducir cuando termina el fundido de entrada', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    renderSlide();

    act(() => {
      vi.advanceTimersByTime(ROTATION_FADE_MS - 1);
    });
    expect(play).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('avisa al terminar el v\u00eddeo', () => {
    const { video, onFinished } = renderSlide();

    fireEvent.ended(video);

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('avisa si el v\u00eddeo no puede reproducirse', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('bloqueado', 'NotAllowedError'));
    const { video, onFinished } = renderSlide();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ROTATION_FADE_MS);
    });
    expect(onFinished).toHaveBeenCalledTimes(1);

    fireEvent.error(video);
    expect(onFinished).toHaveBeenCalledTimes(2);
  });
});
