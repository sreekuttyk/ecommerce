var db=require('../config1/connection1')
var collection=require('../config1/collections')
const bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectID
const Razorpay=require('razorpay')
const { response } = require('express')
var instance = new Razorpay({
    key_id: 'rzp_test_Emexow7awvthaF',
    key_secret: 'niNmdTd9gyq4g1IrJgsx2vuP'
    
  });
module.exports={
    doSignup:(userdata)=>{
        return new Promise(async(resolve,reject)=>{

        
        userdata.password=await bcrypt.hash(userdata.password,10)
        db.get().collection(collection.USERCOLLECTION).insertOne(userdata).then((data)=>{

        
        resolve(data.ops[0])
        })
    })
    },
    doLogin:(userdata)=>{
        return new Promise(async(resolve,reject)=>{
            let loginstatus=false
            let response={}
            let user=await db.get().collection(collection.USERCOLLECTION).findOne({Email:userdata.Email})
            if(user){
                bcrypt.compare(userdata.password,user.password).then((status)=>{
                    if(status){
                        console.log('login success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log('login failed')
                        resolve({status:false})
                    }
                })
            }else{
                console.log('login failed')
                resolve({status:false})
            }
        })
    },
    addtocart:(proId,userId)=>{
        let proobj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proexist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proexist)
                if(proexist!=-1){
                    db.get().collection(collection.CARTCOLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CARTCOLLECTION)
                .updateOne({user:objectId(userId)},
                {
                    
                       $push:{products:proobj}
                
                }
               ).then((response)=>{
                    resolve()
               })

            }
        }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proobj]
                }
                db.get().collection(collection.CARTCOLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
                
            }
                
        
        })
    },
    getcartproducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartitems=await db.get().collection(collection.CARTCOLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                $lookup:{
                    from:collection.PRODUCTCOLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
               // {
                  //  $lookup:{
                      //  from:collection.PRODUCTCOLLECTION,
                      //  let:{prodlist:'$products'},
                       // pipeline:[
                          //  {
                              //  $match:{
                                   // $expr:{
                                     // $in:['$_id',"$$prodlist"]  
                                   // }
                               // }
                          //  }
                        //],
                       // as:'cartitems'
                   // }
               // }

            ]).toArray()
            console.log(cartitems[0].products);
            resolve(cartitems)

        })
    },
    getcartcount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectId(userId)})
        if(cart){
            count=cart.products.length
        }
        resolve(count)
    })
},
changeproductquantity:(details)=>{
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1)
        {
            db.get().collection(collection.CARTCOLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeproduct:true})
            })

        }else{

        db.get().collection(collection.CARTCOLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })
        }    
    })

},
gettotalamount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CARTCOLLECTION).aggregate([
            {
                $match:{user:objectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
            $lookup:{
                from:collection.PRODUCTCOLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            },
            {
            $group:{
                _id:null,
                total:{$sum:{$multiply:['$quantity',{$toInt:'$product.Price'}]}}
            }
        }
           

        ]).toArray()
        console.log(total[0].total);
        
        resolve(total[0].total)
    })
},
removeproduct:(rem)=>{
    return new Promise((resolve,reject)=>{
        
        
            db.get().collection(collection.CARTCOLLECTION)
            .updateOne({_id:objectId(rem.cart)},
            {
                $pull:{products:{item:objectId(rem.product)}}
            }
            ).then((response)=>{
                resolve({removeproduct:true})
            })

        })
},
placeorder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
        console.log(order,products,total)
        let status=order['paymentmethod']==='COD'?'placed':'pending'
        let orderobj={
            deliverydetails:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode
                
            },
            userId:objectId(order.userId),
            paymentmethod:order['paymentmethod'],
            products:products,
            status:status,
            date:new Date().toLocaleDateString(),
            total:total
            
        }
        db.get().collection(collection.ORDERCOLLECTION).insertOne(orderobj).then((response)=>{
            db.get().collection(collection.CARTCOLLECTION).removeOne({user:objectId(order.userId)})
            resolve(response.ops[0]._id)
        })
    })

},
getcartproductlist:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CARTCOLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
    })
},
getuserorders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
let orders=await db.get().collection(collection.ORDERCOLLECTION).find({userId:objectId(userId)}).toArray()
console.log(orders)
resolve(orders)
    })
},
getorderproducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDERCOLLECTION).aggregate([
            {
                $match:{_id:objectId(orderId)}
            },
            {
                $unwind:'$products'
            
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
            $lookup:{
                from:collection.PRODUCTCOLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
           // {
              //  $lookup:{
                  //  from:collection.PRODUCTCOLLECTION,
                  //  let:{prodlist:'$products'},
                   // pipeline:[
                      //  {
                          //  $match:{
                               // $expr:{
                                 // $in:['$_id',"$$prodlist"]  
                               // }
                           // }
                      //  }
                    //],
                   // as:'cartitems'
               // }
           // }

        ]).toArray()
        console.log(orderItems);
        resolve(orderItems)

    })
},
generaterazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var options = {  amount: total*100,  // amount in the smallest currency unit  currency: "INR",  receipt: "order_rcptid_11"};instance.orders.create(options, function(err, order) {  console.log(order);});
        currency: "INR",
  receipt: ""+orderId
};
instance.orders.create(options, function(err, order) {
    if(err){
        console.log(err)
    }
    else{
  console.log("new order:",order);
  resolve(order)
    }
});
    })
},
verifypayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
            
        
          
          let hmac = crypto.createHmac('sha256', 'niNmdTd9gyq4g1IrJgsx2vuP');
          
          hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
          hmac=hmac.digest('hex')
          if(hmac==details['payment[razorpay_signature]']){
              resolve()
          }else{
              reject()
          }
          
    })

},
changepaymentstatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDERCOLLECTION)
        .updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }
        ).then(()=>{
            resolve()
        })
    })
}


}
    
