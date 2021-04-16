var db=require('../config1/connection1')
var collection=require('../config1/collections')
var objectId=require('mongodb').ObjectID
module.exports={
    addproduct:(product,callback)=>{
        console.log(product)
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data)
            callback(data.ops[0]._id)
            

        })
    },
    getallproducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCTCOLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCTCOLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
            
        })
    },
    getproductdetails:(proId)=>{
        return new Promise((resolve,reject)=>{

        
        db.get().collection(collection.PRODUCTCOLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
            resolve(product)
        })
    })
},
updateproduct:(proId,proDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCTCOLLECTION).updateOne({_id:objectId(proId)},{
            $set:{
                Name:proDetails.Name,
                Description:proDetails.Description,
                Price:proDetails.Price,
                Category:proDetails.Category
            }
        }).then((response)=>{
            resolve()
        })
    })
} 
}