import { Mixer, MixerArguments } from './mixer';
import { Input, InputArguments } from './input';
import { Readable, ReadableOptions } from 'stream';

import * as _ from 'underscore';

export class InterleavedMixer extends Mixer {

    /**
     * Called when this stream is read from
     */
    public _read() {
        let samples = Number.MAX_VALUE;

        this.inputs.forEach((input) => {
            let ias = input.availableSamples();
            if (ias < samples) {
                samples = ias;
            }
        });

        if (samples > 0 && samples !== Number.MAX_VALUE) {
            let mixedBuffer = new Buffer(samples * this.sampleByteLength * this.args.channels);

            mixedBuffer.fill(0);

            for (let c = 0; c < this.args.channels; c++) {
                let input = this.inputs[c];

                if (input !== undefined) {
                    let inputBuffer = input.readMono(samples);

                    for (let i = 0; i < samples; i++) {
                        let sample = this.readSample.call(inputBuffer, i * this.sampleByteLength);

                        this.writeSample.call(mixedBuffer, sample, (i * this.sampleByteLength * this.args.channels) + (c * this.sampleByteLength));
                    }
                }
            }

            this.push(mixedBuffer);
        } else {
            setImmediate(this._read.bind(this));
        }

        if (this.args.clearInterval) {
            this.clearBuffers();
        }
    }
}