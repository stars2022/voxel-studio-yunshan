/** glTF POSITION accessors use IEEE float32. Native voxels remain exact.
 * Compare to the actual required encoding, not an arbitrary looser epsilon.
 * A displaced vertex must never pass merely because the asset is large. */
export function checkFloat32Bounds(expected:{min:number[];max:number[]},actual:{min:number[];max:number[]}){
 const want=[...expected.min,...expected.max],got=[...actual.min,...actual.max];
 if(want.length!==6||got.length!==6||![...want,...got].every(Number.isFinite))throw new Error('Invalid export bounds');
 const maxErrorM=Math.max(...want.map((v,i)=>Math.abs(v-got[i])));
 const roundingAllowanceM=Math.max(...want.map(v=>Math.abs(v-Math.fround(v))));
 return{maxErrorM,roundingAllowanceM,matchesFloat32Rounding:want.every((v,i)=>got[i]===Math.fround(v))};
}
