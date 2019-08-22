/** @babel */

/**
 * @TODO: Do something more meaningful
 */

import { join } from 'path'

const packagePath = join(__dirname, "..")

describe('ink', () => {
  it('should activate', () => {
    waitsForPromise(() => atom.packages.activatePackage(packagePath))
    runs(() => {
      expect(atom.packages.isPackageActive('ink')).toBe(true)
    })
  })
})
