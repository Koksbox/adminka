import {useEffect, useState} from "react";
import {BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams} from "react-router";

function getProducts() {
    const data = localStorage.getItem("products");

    if (!data) {
        return [];
    }

    try {
        const products = JSON.parse(data);
        return Array.isArray(products) ? products : [];
    } catch {
        return [];
    }
}

function saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
}

function AdminLayout() {
    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <Link className="navbar-brand" to="/admin/products">
                        Админка каталога
                    </Link>
                </div>
            </nav>
            <Outlet />
        </>
    );
}

function ProductItem({product, onDelete}) {
    return (
        <tr>
            <td>{product.name}</td>
            <td>{product.category}</td>
            <td className="text-nowrap">{product.price} ₽</td>
            <td className="text-nowrap">
                <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="btn btn-sm btn-outline-primary me-2"
                >
                    Редактировать
                </Link>
                <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(product.id)}
                >
                    Удалить
                </button>
            </td>
        </tr>
    );
}

function ProductListPage() {
    const location = useLocation();
    const [products, setProducts] = useState(() => getProducts());
    const [notice, setNotice] = useState(location.state?.message ?? "");

    useEffect(() => {
        saveProducts(products);
    }, [products]);

    function handleDelete(productId) {
        const product = products.find(item => item.id === productId);
        const confirmed = window.confirm(
            product ? `Удалить товар «${product.name}»?` : "Удалить товар?"
        );

        if (!confirmed) {
            return;
        }

        setProducts(currentProducts =>
            currentProducts.filter(item => item.id !== productId)
        );
        setNotice("");
    }

    return (
        <main className="container py-4">
            <h1 className="mb-4">Каталог товаров</h1>
            {notice && (
                <div className="alert alert-success" role="status">
                    {notice}
                </div>
            )}
            <Link to="/admin/products/new" className="btn btn-primary mb-3">
                Добавить товар
            </Link>
            {products.length === 0 ? (
                <div className="alert alert-info" role="status">
                    Каталог пуст. Добавьте первый товар.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col">Название</th>
                                <th scope="col">Категория</th>
                                <th scope="col">Цена</th>
                                <th scope="col">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <ProductItem
                                    key={product.id}
                                    product={product}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

function ProductFormPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const isEdit = id !== undefined;

    const [product] = useState(() => {
        if (!id) {
            return null;
        }

        return getProducts().find(item => item.id === id) ?? null;
    });

    const [name, setName] = useState(product?.name ?? "");
    const [price, setPrice] = useState(product ? String(product.price) : "");
    const [category, setCategory] = useState(product?.category ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [error, setError] = useState("");

    if (isEdit && !product) {
        return (
            <main className="container py-4">
                <h1 className="mb-4">Редактирование товара</h1>
                <div className="alert alert-danger" role="status">
                    Товар не найден
                </div>
                <Link to="/admin/products" className="btn btn-secondary">
                    К каталогу
                </Link>
            </main>
        );
    }

    function handleSubmit(event) {
        event.preventDefault();

        const trimmedName = name.trim();
        const trimmedPrice = price.trim();

        if (!trimmedName || trimmedPrice === "") {
            setError("Заполните название и цену.");
            return;
        }

        const numericPrice = Number(trimmedPrice);

        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            setError("Укажите корректную цену.");
            return;
        }

        const currentProducts = getProducts();
        const fields = {
            name: trimmedName,
            price: numericPrice,
            category: category.trim(),
            description: description.trim()
        };

        if (isEdit) {
            const updatedProducts = currentProducts.map(item =>
                item.id === id ? {...item, ...fields} : item
            );
            saveProducts(updatedProducts);
        } else {
            saveProducts([
                ...currentProducts,
                {
                    id: crypto.randomUUID(),
                    ...fields
                }
            ]);
        }

        navigate("/admin/products", {state: {message: "Товар сохранён"}});
    }

    return (
        <main className="container py-4">
            <h1 className="mb-4">{isEdit ? "Редактирование товара" : "Новый товар"}</h1>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="col-lg-8 px-0" noValidate>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                        Название товара
                    </label>
                    <input
                        id="name"
                        name="name"
                        className="form-control"
                        value={name}
                        onChange={event => setName(event.target.value)}
                        required
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="price" className="form-label">
                            Цена
                        </label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="1"
                            className="form-control"
                            value={price}
                            onChange={event => setPrice(event.target.value)}
                            required
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="category" className="form-label">
                            Категория
                        </label>
                        <input
                            id="category"
                            name="category"
                            className="form-control"
                            value={category}
                            onChange={event => setCategory(event.target.value)}
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                        Описание
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows="4"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary me-2">
                    Сохранить
                </button>
                <Link to="/admin/products" className="btn btn-secondary">
                    Отмена
                </Link>
            </form>
        </main>
    );
}

function ProductFormRoute() {
    const {id} = useParams();

    return <ProductFormPage key={id ?? "new"} />;
}

function NotFoundPage() {
    return (
        <main className="container py-4">
            <h1 className="mb-4">Страница не найдена</h1>
            <Link to="/admin/products" className="btn btn-primary">
                К каталогу
            </Link>
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/admin/products" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="products" replace />} />
                    <Route path="products" element={<ProductListPage />} />
                    <Route path="products/new" element={<ProductFormRoute />} />
                    <Route path="products/:id/edit" element={<ProductFormRoute />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App
