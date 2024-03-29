const replaceTemp = (temp,product)=>{
    let output = temp.replace(/{%productName%}/g,product.productName)
    output = output.replace(/{%image%}/g,product.image)
    output = output.replace(/{%price%}/g,product.price)
    output = output.replace(/{%from%}/g,product.from)
    output = output.replace(/{%nutrients%}/g,product.nutrients)
    output = output.replace(/{%quantity%}/g,product.quantity)
    output = output.replace(/{%description%}/g,product.description)
    output = output.replace(/{%ID%}/g,product.id)
    if(!product.organic) output = output.replace(/{%Not_Organic%}/g,'not-organic')
    return output
}

module.exports = replaceTemp