// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'assets/base');
const OVERRIDE = path.join(ROOT, 'assets/override');
const PRODUCT_NAME = 'BokengiGp';

// i18n keys that must keep crediting Mattermost (license attribution)
const ATTRIBUTION_KEYS = new Set(['settings.notice_text', 'settings.about.powered_by']);

const PNG_COLOR_TYPE_RGB = 2;
const PNG_COLOR_TYPE_PALETTE = 3;
const PNG_COLOR_TYPE_RGBA = 6;

// Native splash colors (android/app/src/main/res/values*/colors.xml splashscreen_bg)
const SPLASH_BG_LIGHT = 'ffffff';
const SPLASH_BG_DARK = '090a0b';

function listFiles(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? listFiles(full) : [full];
    });
}

function readPngHeader(file: string) {
    const buffer = fs.readFileSync(file);
    expect(buffer.toString('ascii', 12, 16)).toBe('IHDR');
    return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), colorType: buffer[25]};
}

function readPngChunks(file: string) {
    const buffer = fs.readFileSync(file);
    const chunks: Record<string, Buffer[]> = {};
    for (let offset = 8; offset < buffer.length;) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        (chunks[type] ||= []).push(buffer.subarray(offset + 8, offset + 8 + length));
        offset += length + 12;
    }
    return chunks;
}

// Returns the set of hex colors used by an 8-bit RGBA or a palette PNG
function readPngColors(file: string) {
    const {width, height, colorType} = readPngHeader(file);
    const chunks = readPngChunks(file);
    if (colorType === PNG_COLOR_TYPE_PALETTE) {
        expect(chunks.tRNS).toBeUndefined();
        const palette = chunks.PLTE[0].toString('hex');
        return new Set(palette.match(/.{6}/g));
    }

    expect(colorType).toBe(PNG_COLOR_TYPE_RGBA);
    const bpp = 4;
    const stride = width * bpp;
    const raw = zlib.inflateSync(Buffer.concat(chunks.IDAT));
    const colors = new Set<string>();
    let previous = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        const line = Buffer.from(raw.subarray((y * (stride + 1)) + 1, (y + 1) * (stride + 1)));
        for (let x = 0; x < stride; x++) {
            const a = x >= bpp ? line[x - bpp] : 0;
            const b = previous[x];
            const c = x >= bpp ? previous[x - bpp] : 0;
            let predictor = 0;
            if (filter === 1) {
                predictor = a;
            } else if (filter === 2) {
                predictor = b;
            } else if (filter === 3) {
                predictor = Math.floor((a + b) / 2);
            } else if (filter === 4) {
                const p = (a + b) - c;
                const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
                if (pa <= pb && pa <= pc) {
                    predictor = a;
                } else {
                    predictor = pb <= pc ? b : c;
                }
            }
            line[x] = (line[x] + predictor) & 0xff;
        }
        for (let x = 0; x < stride; x += bpp) {
            colors.add(line.toString('hex', x, x + bpp));
        }
        previous = line;
    }
    return colors;
}

const relative = (root: string, file: string) => path.relative(root, file).split(path.sep).join('/');

describe('BokengiGp branding', () => {
    const overridePngs = listFiles(OVERRIDE).filter((f) => f.endsWith('.png')).map((f) => relative(OVERRIDE, f));

    it('should override every launcher icon, splash logo and in-app logo', () => {
        const required = listFiles(BASE).map((f) => relative(BASE, f)).filter((f) => (
            (f.startsWith('release/icons/') && f.endsWith('.png')) ||
            (/^release\/splash_screen\/(android\/drawable-[^/]+\/splash(_background)?|ios\/splash|ios\/Splash(Icon|Background)\.imageset\/[^/]+)\.png$/).test(f) ||
            f === 'images/icon.png' ||
            f === 'images/logo.png'
        ));

        expect(required.length).toBe(75);
        expect(required.filter((f) => !overridePngs.includes(f))).toEqual([]);
        expect(overridePngs).toContain('images/logo_white.png');
    });

    it('should keep the native dimensions and never reuse a Mattermost asset', () => {
        for (const file of overridePngs) {
            const basePath = path.join(BASE, file);
            if (!fs.existsSync(basePath)) {
                continue;
            }
            const base = readPngHeader(basePath);
            const override = readPngHeader(path.join(OVERRIDE, file));
            expect({file, width: override.width, height: override.height}).toEqual({file, width: base.width, height: base.height});
            expect(fs.readFileSync(path.join(OVERRIDE, file)).equals(fs.readFileSync(basePath))).toBe(false);
        }
    });

    it('should ship opaque iOS app icons', () => {
        const iosIcons = overridePngs.filter((f) => f.startsWith('release/icons/ios/'));

        expect(iosIcons.length).toBe(15);
        for (const file of iosIcons) {
            expect({file, colorType: readPngHeader(path.join(OVERRIDE, file)).colorType}).toEqual({file, colorType: PNG_COLOR_TYPE_RGB});
        }
    });

    it('should use plain splash backgrounds matching the native splash colors', () => {
        const backgrounds = overridePngs.filter((f) => (/splash_background\.png$|SplashBackground[^/]*\.png$/).test(f));

        expect(backgrounds.length).toBe(16);
        for (const file of backgrounds) {
            const dark = (/drawable-night-|SplashBackgroundDark/).test(file);
            const opaque = dark ? SPLASH_BG_DARK : `${SPLASH_BG_LIGHT}ff`;
            expect({file, colors: [...readPngColors(path.join(OVERRIDE, file))]}).toEqual({file, colors: [opaque]});
        }
    });

    it.each(['en', 'fr'])('should brand the %s strings while keeping the Mattermost attribution', (locale) => {
        const baseEn = JSON.parse(fs.readFileSync(path.join(BASE, 'i18n/en.json'), 'utf8'));
        const strings: Record<string, string> = JSON.parse(fs.readFileSync(path.join(OVERRIDE, `i18n/${locale}.json`), 'utf8'));

        for (const [key, value] of Object.entries(strings)) {
            expect(key in baseEn).toBe(true);
            if (ATTRIBUTION_KEYS.has(key)) {
                expect(value).toContain('Mattermost');
            } else {
                expect({key, value}).toEqual({key, value: expect.stringContaining(PRODUCT_NAME)});
                expect({key, value}).toEqual({key, value: expect.not.stringContaining('Mattermost')});
            }
        }
        expect(strings['about.mattermost']).toBe(PRODUCT_NAME);
        expect(strings['settings.notice_text']).toContain('Bokengi Group');
    });

    it('should name the unsigned builds BokengiGp unless APP_NAME is set', () => {
        const fastfile = fs.readFileSync(path.join(ROOT, 'fastlane/Fastfile'), 'utf8');

        expect(fastfile.match(/ENV\['APP_NAME'\] \|\|= 'BokengiGp'/g)).toHaveLength(3);
        expect(fastfile).not.toMatch(/ENV\['APP_NAME'\] = 'Mattermost'/);
    });

    it('should version the override assets', () => {
        const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);

        expect(gitignore.indexOf('!assets/override')).toBeGreaterThan(gitignore.indexOf('assets/override'));
    });
});
