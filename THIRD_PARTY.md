# Third-party notices

The `vendor/openfx/include` headers are from the official OpenFX project:
https://github.com/AcademySoftwareFoundation/openfx

Pinned revision: `c3f1c2dcf4f51762b794c4fc21181b4a501be1bf`.
Their license is reproduced in `vendor/openfx/LICENSE.md` and in the Windows
package as `OPENFX-LICENSE.md`. Individual copyright notices remain in the headers.
No OpenFX support library was linked.

The Windows release was cross-compiled with Debian MinGW-w64 GCC 14 (POSIX),
using statically linked GCC/C++ runtimes under the GCC Runtime Library Exception:
https://www.gnu.org/licenses/gcc-exception-3.1.html
MinGW-w64 runtime notices: https://www.mingw-w64.org/license/
The compiler itself is not redistributed in this package.

No ToneLab executable, code, artwork, preset, LUT, license key or SDK is included.
REA 6.8.0 was used to inspect the supplied installer; its output informed the
feature investigation, not the implementation of proprietary processing.

## Supplied DJI LUT

The user supplied `DJI Avata 2 D-Log M to Rec.709 V1._.cube` for this integration.
Its original bytes are preserved in `assets/luts/DJI-Avata-2-DLogM-to-Rec709.cube`.
The Windows package also includes this original file and its `PROVENANCE.json`
under `Contents/Resources/LUTs`. A generated RGB table is embedded into the plugin.

SHA-256: `b18162854ab47702068410c33afa98a8cb6eef159fc5a04ce0e65fad0fd8947e`.
The attachment identifies Avata 2, while an internal comment reads
`Mavic 3 Pro, D-Log M, 2023-03-24`. Neither comment nor numeric entries were
rewritten to hide that discrepancy. The file does not declare an output gamma.
Its identity was not independently verified against a direct DJI download.

This third-party LUT is separate from the original MIT-licensed plugin code.
The uploaded file contains no explicit license text; DJI names and LUT data
are not claimed as original work by this project.

As faixas e nomes funcionais das ferramentas avançadas foram organizados a partir do catálogo de metadados do arquivo fornecido pelo usuário. Fórmulas, receitas e 65 variações (Mendes) são próprias; não há incorporação do binário, código ou LUTs comerciais do ToneLab.

## OpenCL

`vendor/opencl/include/CL` contains Khronos OpenCL C headers, from the Debian
trixie `opencl-c-headers` package. Individual copyright/SPDX notices remain
in the headers; full package notices are in `vendor/opencl/LICENSE.txt`,
shipped as `OPENCL-LICENSE.txt`. The OpenCL loader is resolved dynamically
from the installed system runtime; no NVIDIA/AMD/Intel driver is bundled.
The original kernels are in `assets/kernels/mendes.cl`. PoCL 6.0 was used as
a CPU OpenCL device for validation only; it is not shipped or linked into
the Windows plugin or installer.
