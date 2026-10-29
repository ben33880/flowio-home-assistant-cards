import{expect,it}from'vitest';import{gaugeGeometry,normalizeVisuals,numericValue}from'../src/gauge-model';
it('borne seulement le tracé et signale le hors-échelle',()=>{expect(gaugeGeometry(20,0,10)!.ratio).toBe(1);expect(gaugeGeometry(20,0,10)!.outOfRange).toBe(true);expect(gaugeGeometry(0,0,100)!.progress).toBe(0);});
it('ne remplace jamais une absence par zéro',()=>{expect(numericValue('0')).toBe(0);for(const v of ['',null,undefined,'unavailable','abc'])expect(numericValue(v)).toBeUndefined();expect(gaugeGeometry(undefined,0,100)).toBeUndefined();});
it('place uniquement les repères dans l’échelle',()=>{expect(gaugeGeometry(7.2,0,14,7.3)!.target).toBeDefined();expect(gaugeGeometry(7.2,0,14,20)!.target).toBeUndefined();});
it('valide et personnalise les échelles',()=>{for(const v of [{ph:{min:7,max:7}},{orp:{max:Infinity}},{pressure:{type:'other'}}])expect(()=>normalizeVisuals(v)).toThrow();expect(normalizeVisuals({ph:{type:'tile'},pressure:{max:6}}).pressure.max).toBe(6);});
