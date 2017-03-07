import { Indicator, IndicatorInput } from '../indicator/indicator';
import { MAInput, SMA } from './SMA';
import LinkedList = require('linkedlist');

export class EMA extends Indicator{
    period:number;
    price:number[];
    result : number[];
    generator:IterableIterator<number | undefined>;
    constructor(input:MAInput) {
        super(input);
        var period = input.period
        var priceArray = input.values;
        var exponent = (2 / (period + 1));
        var sma:SMA;

        this.result = [];

        sma = new SMA({period : period, values :[]});

        var genFn = (function* ():IterableIterator<number | undefined>{
            var tick  = yield;
            var prevEma;
            while (true) {
                if(prevEma && tick){
                    prevEma = ((tick - prevEma) * exponent) + prevEma;
                    tick = yield prevEma;
                }else {
                    tick = yield;
                    prevEma = sma.nextValue(tick)
                    if(prevEma)
                        tick = yield prevEma;
                }
            }
        });

        this.generator = genFn();

        this.generator.next();
        this.generator.next();

        priceArray.forEach((tick) => {
            var result = this.generator.next(tick);
            if(result.value){
                this.result.push(this.format(result.value));
            }
        });
    }

    static calculate(input:MAInput):number[] {
        Indicator.reverseInputs(input);
        var result = new EMA(input).result;
        if(input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    }

    nextValue(price:number) {
        var result = this.generator.next(price).value;
        if(result)
            return this.format(result);
    };
}
