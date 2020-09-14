import { Pipe, PipeTransform } from '@angular/core';

type Out = { [klass: string]: any };
type In = string | string[] | Set<string> | { [klass: string]: any };

@Pipe({
  name: 'combineClasses'
})
export class CombineClassesPipe implements PipeTransform {

  transform(value: In[]): Out {
    const combined = value.reduce<Out>((c: Out, n: In) => {
      if (!n) {
        return c;
      } else if (typeof(n) === 'string') {
        return { ...c, [n]: true };
      } else if (Array.isArray(n)) {
        return n.reduce((s, nc) => ({ ...s, [nc]: true }), c);
      } else if (n instanceof Set) {
        return [...n.values()].reduce((s, nc) => ({ ...s, [nc]: true }), c);
      }
      return { ...c, ...n };
    }, {});
    return combined;
  }

}
