import '@testing-library/jest-dom';
import { FloorplanElement } from '../../../src/components/floorplan/floorplan-element';
import { FloorplanCardHostConfig } from '../../../src/components/floorplan/lib/floorplan-config';

describe('Floorplan card hosts', () => {
  const svgNamespace = 'http://www.w3.org/2000/svg';

  beforeAll(() => {
    const foreignObjectCtor = (global as any).SVGForeignObjectElement;
    if (!foreignObjectCtor) {
      (global as any).SVGForeignObjectElement = window.SVGElement;
    }
  });

  function createSvgWithTarget(id: string): {
    svg: SVGGraphicsElement;
    target: SVGGraphicsElement;
  } {
    const svg = document.createElementNS(svgNamespace, 'svg') as SVGGraphicsElement;
    const target = document.createElementNS(svgNamespace, 'rect') as SVGGraphicsElement;
    target.id = id;
    Object.defineProperty(target, 'getBBox', {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 100, height: 50 } as DOMRect),
    });
    svg.appendChild(target);
    document.body.appendChild(svg);
    return { svg, target };
  }

  afterEach(() => {
    document.body.querySelectorAll('svg').forEach((element) => element.remove());
  });

  it('keeps the original target when overlaying and applies pointer events', () => {
    const { svg, target } = createSvgWithTarget('overlay-target');

    const overlayHost: FloorplanCardHostConfig = {
      target: '#overlay-target',
      mode: 'overlay',
      pointer_events: 'none',
    };

    const element = new FloorplanElement();
    const internal = element as any;
    internal.config = { card_hosts: [overlayHost] };

    internal.initCardHosts(svg, internal.config);

    const hosts = Array.from(internal._cardHosts.values());
    expect(hosts).toHaveLength(1);
    const host = hosts[0];

    expect(svg.querySelector('#overlay-target')).toBe(target);
    expect(target.parentElement).not.toBeNull();
    expect(target.parentElement?.contains(host.foreignObject)).toBe(true);
    expect(host.container.style.pointerEvents).toBe('none');
  });

  it('updates pointer events for replace mode variants without removing the original foreign object', async () => {
    const entityId = 'sensor.demo';
    const { svg } = createSvgWithTarget('replace-target');

    const replaceHost: FloorplanCardHostConfig = {
      target: '#replace-target',
      variants: [
        {
          pointer_events: 'none',
          conditions: [
            {
              entity: entityId,
              state: 'active',
            },
          ],
        },
      ],
    };

    const element = new FloorplanElement();
    const internal = element as any;
    internal.config = { card_hosts: [replaceHost] };
    element.hass = {
      states: {
        [entityId]: {
          entity_id: entityId,
          state: 'inactive',
          attributes: {},
          context: {},
        },
      },
    } as any;

    internal.initCardHosts(svg, internal.config);

    const hosts = Array.from(internal._cardHosts.values());
    expect(hosts).toHaveLength(1);
    const host = hosts[0];

    expect(host.foreignObject.id).toBe('replace-target');
    expect(svg.querySelector('#replace-target')).toBe(host.foreignObject);
    expect(host.container.style.pointerEvents).toBe('auto');

    element.hass.states[entityId].state = 'active';
    await internal.updateCardHosts(new Set([entityId]));
    expect(host.container.style.pointerEvents).toBe('none');

    element.hass.states[entityId].state = 'inactive';
    await internal.updateCardHosts(new Set([entityId]));
    expect(host.container.style.pointerEvents).toBe('auto');
  });
});
