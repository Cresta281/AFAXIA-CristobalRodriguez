import './Cart.css'
import { useContext, useState } from "react"
import CartContext from '../../context/CartContext'
import CartItem from '../CartItem/CartItem'
import { getDocs, writeBatch, query, where, collection, documentId, addDoc } from 'firebase/firestore'
import { firestoreDb } from '../../services/firebase/index'



const Cart = () => {

    const [loading, setLoading] = useState(false)

    const { cart, clearCart, getTotal, getQuantity } = useContext(CartContext)  


    const createOrder = () => {
        setLoading(true)

        const objOrder = {
            items: cart,
            buyer: {
                name: 'Cristobal Rodriguez',
                phone: '55555555',
                email: 'tobal.rodriguez@gmail.com'
            },
            total: getTotal(),
            date: new Date()
        }

        const ids = cart.map(prod => prod.id)

        const batch = writeBatch(firestoreDb)

        const collectionRef = collection(firestoreDb, 'products')

        const outOfStock = []

        getDocs(query(collectionRef, where(documentId(), 'in', ids)))
            .then(response => {
                response.docs.forEach(doc => {
                    const dataDoc = doc.data()
                    const prodQuantity = cart.find(prod => prod.id === doc.id)?.quantity

                    if(dataDoc.stock >= prodQuantity) {
                        batch.update(doc.ref, { stock: dataDoc.stock - prodQuantity})
                    } else {
                        outOfStock.push({ id: doc.id, ...dataDoc })
                    }
                })
            }).then(() => {
                if(outOfStock.length === 0) {
                    const collectionRef = collection(firestoreDb, 'orders')
                    return addDoc(collectionRef, objOrder)
                } else {
                    return Promise.reject({ name: 'outOfStockError', products: outOfStock})
                }
            }).then(({ id }) => {
                batch.commit()
                console.log(`El id de la orden es ${id}`)
            }).catch(error => {
                console.log(error)
            }).finally(() => {
                setLoading(false)
            })
    }
    if(loading) {
        return <h1>Se esta creando su orden</h1>
    }

    if (cart.length === 0){
        return(
            <h1>Aún no tienes elementos seleccionados en el carrito</h1>
        )
    }

    return(
        <>
        <h1>Su carrito</h1>
        <ul> 
            {cart.map(prod => <li key={prod.id}>{prod.name} cantidad: {prod.quantity} subtotal: {prod.quantity * prod.price}<button onClick={() => removeItem(prod.id)}>X</button></li>)}
        </ul>
        </>
    )
} 

export default Cart