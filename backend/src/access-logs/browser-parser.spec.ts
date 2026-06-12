import { parseBrowser } from './browser-parser';

describe('parseBrowser', () => {
  it('detecta Chrome', () => {
    expect(
      parseBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      ),
    ).toBe('Chrome');
  });

  it('detecta Edge (antes que Chrome, porque su UA contiene Chrome)', () => {
    expect(
      parseBrowser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
      ),
    ).toBe('Edge');
  });

  it('detecta Firefox', () => {
    expect(
      parseBrowser('Mozilla/5.0 (Windows NT 10.0; rv:126.0) Gecko/20100101 Firefox/126.0'),
    ).toBe('Firefox');
  });

  it('devuelve Desconocido para cadenas vacías o raras', () => {
    expect(parseBrowser('')).toBe('Desconocido');
    expect(parseBrowser('curl/8.0')).toBe('Desconocido');
  });
});
