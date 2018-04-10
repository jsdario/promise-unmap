
# promiseUnmap

[![CircleCI](https://circleci.com/gh/jsdario/promise-unmap.svg?style=svg)](https://circleci.com/gh/jsdario/promise-unmap)

Similar to Promise.map(ary) with some connotations:

1. If all promises resolve, the global promise resolves,
   that is identical.
2. All promises are going to be started, unmap won't
   fulfill until all of them resolve or reject.
3. If any promises reject, promiseUnmap will reject
   with an Error containing all errors in its body
   as `err.errors: Array<Error>`. The message of the global
   error will be: "One or more tasks failed". Any fulfillments
   will also be inside `err.fulfillments: Array<any>`
4. If it fulfills, it will resolve the map of fulfillments.
   Here it is a playground: https://runkit.com/jsdario/promise-unmap


```javascript
export function promiseUnmap (promises: Array<Promise>) {
  return Promise.all(promises.map(p => p.catch(err => err)))
    .then(results => {
      if (results.some(r => r instanceof Error)) {
        throw new PromiseUnmapError(results)
      }
      return results
    })
}
```
