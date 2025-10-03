import '@testing-library/jest-dom';
import '../../../src/components/floorplan-examples/floorplan-examples';
import { FloorplanElement } from '../../../src/components/floorplan/floorplan-element';
import {
  createFloorplanExampleElement,
  getFloorplanElement,
  getFloorplanSvg,
} from '../jest-floorplan-utils';
import { retry } from '../jest-common-utils';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Utils } from '../../../src/lib/utils';

const indentYaml = (value: string, spaces = 2): string =>
  value
    .split('\n')
    .map((line) => (line ? `${' '.repeat(spaces)}${line}` : line))
    .join('\n');

describe('Configuration', () => {
  beforeEach(() => {
  });

  afterEach(() => {
    // Remove the floorplan-example element from the DOM
    const element = document.querySelector('floorplan-example');
    if (element) element.remove();
  });

  it('Will initiate ha-floorplan if no rules and stylesheet', async () => {
    const simulatedEntity = 'sensor.temperature_living_area';
    const targetSvgElementId = 'radar-toggle-btn-text';

    createFloorplanExampleElement(
      {
        name: 'TestPlate',
        dir: 'test_plate',
        configYaml: `title: TestPlate
config:
  image: /local/floorplan/examples/test_plate/test_plate.svg
        `,
        simulationFile: 'simulations.yaml',
        isCard: true,
      },
      'examples',
      true,
      () => {}
    );

    // Use the utility function to get the floorplan element
    const floorplanElementInstance = await getFloorplanElement();
    expect(floorplanElementInstance).toBeInstanceOf(FloorplanElement);

    // Get the svg
    const svg = await getFloorplanSvg();
    expect(svg).toBeInstanceOf(SVGElement);

    // Validate that our entity is part of the states
    expect(
      floorplanElementInstance?.hass?.states?.[simulatedEntity]
    ).toBeDefined();

    // Now we expect that the text has changed
    await retry(
      async () => {
        const targetEl = svg.querySelector(
          `#${targetSvgElementId}`
        ) as SVGElement;

        // Expect the innerHTML to match the text
        expect(targetEl.innerHTML).toMatch('Click to hide radar');
      },
      10,
      700 // This should not match the emulator time sequence
    );
  });

  it('Will not initiate ha-floorplan if no image', async () => {
    // Spy on console.error and save the logs
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation((message, ...optionalParams) => {
        // Save the logs to an array for later assertions
        capturedLogs.push({ message, optionalParams });
      });

    // Array to store captured logs
    const capturedLogs: { message: any; optionalParams: any[] }[] = [];

    createFloorplanExampleElement(
      {
        name: 'TestPlate',
        dir: 'test_plate',
        configYaml: `title: TestPlate
config:
  stylesheet: /local/floorplan/examples/test_plate/test_plate.css
      `,
        simulationFile: 'simulations.yaml',
        isCard: true,
      },
      'examples',
      true,
      () => {}
    );

    // Use the utility function to get the floorplan element
    const floorplanElementInstance = await getFloorplanElement();
    expect(floorplanElementInstance).toBeInstanceOf(FloorplanElement);

    // Get the svg
    await expect(async () => {
      await getFloorplanSvg();
    }).rejects.toThrow('SVG element not found inside floorplan-element');

    return await retry(
      async () => {
        // Check if console.log was called
        expect(consoleErrorSpy).toHaveBeenCalled();

        // Restore the original console.log implementation
        consoleErrorSpy.mockRestore();

        // Expect captured logs to contain a "no image provided" message
        expect(
          capturedLogs.some((log) => log.message.includes('No image provided'))
        ).toBe(true);
      },
      10, 
      700
    );
  });

  it('initializes card hosts defined with element alias', async () => {
    const cardsDir = path.resolve(process.cwd(), 'docs/examples/cards');
    const cardsYamlPath = path.join(cardsDir, 'cards.yaml');
    const cardsSvgPath = path.join(cardsDir, 'cards.svg');
    const cardsCssPath = path.join(cardsDir, 'cards.css');

    const cardsYamlText = fs.readFileSync(cardsYamlPath, 'utf8');
    const cardsSvgText = fs.readFileSync(cardsSvgPath, 'utf8');
    const cardsCssText = fs.readFileSync(cardsCssPath, 'utf8');

    const cardsConfig = yaml.load(cardsYamlText) as Record<string, unknown> & {
      cards?: unknown[];
    };

    const normalizedCardsConfig = {
      ...cardsConfig,
      card_hosts: cardsConfig.cards,
    };

    const configYaml = `title: Cards Example\nconfig:\n${indentYaml(
      yaml.dump(normalizedCardsConfig, { lineWidth: -1 })
    )}`;

    const originalFetchText = Utils.fetchText;
    const fetchSpy = jest
      .spyOn(Utils, 'fetchText')
      .mockImplementation(
        async (resourceUrl: string, isDemo: boolean, examplesPath: string, useCache: boolean) => {
          if (resourceUrl.includes('cards.svg')) {
            return cardsSvgText;
          }

          if (resourceUrl.includes('cards.css')) {
            return cardsCssText;
          }

          return originalFetchText.call(
            Utils,
            resourceUrl,
            isDemo,
            examplesPath,
            useCache
          );
        }
      );

    try {
      createFloorplanExampleElement(
        {
          name: 'cards',
          dir: 'cards',
          configYaml,
          isCard: true,
        },
        'examples',
        true,
        () => {}
      );

      const floorplanElementInstance = await getFloorplanElement();
      expect(floorplanElementInstance).toBeInstanceOf(FloorplanElement);

      await getFloorplanSvg();

      expect(floorplanElementInstance.config.card_hosts?.length).toBeGreaterThan(0);

      const resolvedTargets =
        floorplanElementInstance.config.card_hosts?.map(
          (host) => host.target ?? host.element
        ) ?? [];

      expect(resolvedTargets).toContain('#living-room-card');
      expect(resolvedTargets).toContain('#status-card');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it.todo('Test image.sizes');
  it.todo('Test image_mobile');
  it.todo('Test log_level');
  it.todo('Test console_log_level');
  it.todo('Test defaults');
});