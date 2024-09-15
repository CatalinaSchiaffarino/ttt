document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner-wrapper');
    const contenedor = document.getElementById('products-container');
    const searchInput = document.getElementById('search'); // Campo de búsqueda
    const categoryId = localStorage.getItem('categoryId') || '101';
    let ObjUsuario = JSON.parse(localStorage.getItem("usuario"));

    if (localStorage.getItem("usuario") && localStorage.getItem("contraseña")) {
        document.getElementById("user").innerHTML = "Cliente: " + ObjUsuario;
    }
    // borrar localStorage(Cerrar Sesión)
    document.getElementById("cerrar").addEventListener("click", function () {
        localStorage.removeItem("usuario");
        localStorage.removeItem("contraseña");
    });

    let mayor$ = document.getElementById("mayor$");
    let menor$ = document.getElementById("menor$");
    let relevancia = document.getElementById("relevancia");

    let filtrarPrecio = document.getElementById("filtrarPrecio");
    let limpiarFiltro = document.getElementById("limpiarFiltro");

    let precioMin = undefined;
    let precioMax = undefined;

    let criterio = undefined;
    let productos = []; // Para almacenar los productos cargados

    const url = `https://japceibal.github.io/emercado-api/cats_products/${categoryId}.json`;

    console.log('Category ID:', categoryId);

    function displayProducts(arrayProductos) {
        if (arrayProductos.length === 0) {
            contenedor.innerHTML = '<div class="alert alert-warning">No hay productos disponibles.</div>';
            return;
        }

        const currencyFormatter = new Intl.NumberFormat('es-UY', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'symbol'
        });

        let html = '';
        arrayProductos.forEach(product => {
            html += `
                <div class="product" data-product-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-info">
                        <h2>${product.name}</h2>
                        <p>${product.description}</p>
                        <p class="price">${currencyFormatter.format(product.cost)}</p>
                        <p class="sold">Cantidad Vendidos: ${product.soldCount}</p>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
    };

    contenedor.addEventListener('click', (event) => {
        let clickedProduct = event.target.closest('.product');
        if (clickedProduct) {
            const productId = clickedProduct.getAttribute('data-product-id');
            localStorage.setItem('selectedProduct', productId); // Guardamos solo el ID en localStorage
            window.location.href = 'product-info.html';
        }
    });

    function ordProductos(criterio, array) {
        let result = [];
        if (criterio === "ORDmayor$") {
            result = array.sort((a, b) => {
                if (a.cost < b.cost) {
                    return 1;
                }
                if (a.cost > b.cost) {
                    return -1;
                }
                return 0;
            });
        } else if (criterio === "ORDmenor$") {
            result = array.sort((a, b) => {
                if (a.cost > b.cost) {
                    return 1;
                }
                if (a.cost < b.cost) {
                    return -1;
                }
                return 0;
            });
        } else if (criterio === "ORDrelevancia") {
            result = array.sort((a, b) => {
                let aVendidos = parseInt(a.soldCount);
                let bVendidos = parseInt(b.soldCount);

                if (aVendidos > bVendidos) {
                    return -1;
                }
                if (aVendidos < bVendidos) {
                    return 1;
                }
                return 0;
            });
        }
        return result;
    }

    function filtrarProductos(array, precioMax, precioMin) {
        return array.filter((producto) => producto.cost >= precioMin && producto.cost <= precioMax);
    }

    function buscarProductos(array, query) {
        if (!query) return array;
        return array.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    function updateDisplay() {
        let filteredProducts = productos;

        if (precioMin !== undefined || precioMax !== undefined) {
            filteredProducts = filtrarProductos(filteredProducts, precioMax, precioMin);
        }

        const query = searchInput.value;
        filteredProducts = buscarProductos(filteredProducts, query);

        displayProducts(filteredProducts);
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            productos = data.products;
            displayProducts(productos);

            searchInput.addEventListener('input', updateDisplay); // Añadir evento de búsqueda en tiempo real

            filtrarPrecio.addEventListener("click", () => {
                precioMin = document.getElementById("precioMin").value || 0;
                precioMax = document.getElementById("precioMax").value || 99999999999;

                updateDisplay();
            });

            limpiarFiltro.addEventListener("click", () => {
                document.getElementById("precioMin").value = "";
                document.getElementById("precioMax").value = "";
                precioMin = undefined;
                precioMax = undefined;
                
                updateDisplay();
            });

            mayor$.addEventListener("click", () => {
                criterio = "ORDmayor$";
                productos = ordProductos(criterio, productos);
                updateDisplay();
                spinner.style.display = 'none';
            });

            menor$.addEventListener("click", () => {
                criterio = "ORDmenor$";
                productos = ordProductos(criterio, productos);
                updateDisplay();
                spinner.style.display = 'none';
            });

            relevancia.addEventListener("click", () => {
                criterio = "ORDrelevancia";
                productos = ordProductos(criterio, productos);
                updateDisplay();
                spinner.style.display = 'none';
            });
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            contenedor.innerHTML = '<div class="alert alert-danger">Error al cargar los productos.</div>';
            spinner.style.display = 'none';
        });
});
