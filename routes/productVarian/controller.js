const {
  Product,
  ProductVarians,
} = require("../../models/");
const {
  fuzzySearch,
  // combineObjects,
} = require("../../helper");
module.exports = {
  getList: async (req, res, next) => {
    try {
      const result = await ProductVarians

        //   .updateMany(
        //     { isDeleted:true },
        //     { $set: { "isDeleted" : false } }
        //  );
        .find()
        .populate('product')
        .lean()

      return res.send(200, {
        message: "Thành công",
        payload: result,
      });
    } catch (err) {
      return res.send(400, {
        message: "Thất bại",
        error: err,
      });
    }
  },
  search: async (req, res, next) => {
    try {
      const { name, priceEnd, priceStart, discountStart, discountEnd } =
        req.query;
      const conditionFind = { isDeleted: false };

      if (name) conditionFind.name = fuzzySearch(name);
      if (discountStart && discountEnd) {
        const compareStart = { $lte: ["$discount", discountEnd] }; // '$field'
        const compareEnd = { $gte: ["$discount", discountStart] };
        conditionFind.$expr = { $and: [compareStart, compareEnd] };
      } else if (discountStart) {
        conditionFind.discount = { $gte: parseFloat(discountStart) };
      } else if (discountEnd) {
        conditionFind.discount = { $lte: parseFloat(discountEnd) };
      }
      if (priceEnd && priceStart) {
        const compareStart = { $lte: ["$price", priceEnd] }; // '$field'
        const compareEnd = { $gte: ["$price", priceStart] };
        conditionFind.$expr = { $and: [compareStart, compareEnd] };
      } else if (priceStart) {
        conditionFind.price = { $gte: parseFloat(priceStart) };
      } else if (priceEnd) {
        conditionFind.price = { $lte: parseFloat(priceEnd) };
      }
      const result = await Product.find(conditionFind)
        .populate("category")
        .populate("supplier")
        .lean();
      if (result) {
        return res.send(200, {
          mesage: "Thành công",
          payload: result,
        });
      }
      return res.send(404, {
        mesage: "Không tìm thấy",
      });
    } catch (err) {
      return res.send(404, {
        mesage: "Thất bại",
        error: err,
      });
    }
  },
  getDetail: async (req, res, next) => {
    const { id } = req.params;
    try {
      const result = await Product.findOne({ _id: id, isDeleted: false })
        .populate("category")
        .populate("supplier")
        .populate("image");
      if (result) {
        return res.send(200, {
          message: "Thành công",
          payload: result,
        });
      }
      return res.send(400, {
        message: "Không tìm thấy",
      });
    } catch (err) {
      return res.send(404, {
        message: "Thất bại",
        errorL: err,
      });
    }
  },

  create: async (req, res, next) => {
    const {
      productId,
      color,
      memory,
      price,
      stock,
      width,
      height,
      legnth,
      weight,
    } = req.body;
    try {
      const exitProduct= await Product.findOne({_id:productId})
     if(!exitProduct){
      return res.status(404).json({
        mesage: "Không tìm thấy ID sản phẩm",
      });
     }
     const exitVarian = await ProductVarians.findOne({
      memory:memory,
      color:color
     })
     if(exitVarian){
      return res.status(404).json({
        mesage: "Mã sản phẩm này đã tồn tại",
      });
     }
     const newRecord = new ProductVarians({
      productId,
      color,
      memory,
      price,
      stock,
      width,
      height,
      legnth,
      weight,
    });
    const result = await newRecord.save();
    return res.status(200).json({
      mesage: "Thành công",
      payload: result,
    });
    } catch (err) {
      return res.send(400, {
        mesage: "Thất bại",
        error: err,
      });
    }
  },
  update: async (req, res, next) => {
    const { id } = req.params;
    const {
      name,
      price,
      discount,
      stock,
      categoryId,
      supplierId,
      description,
      mediaId,
      isDeleted,
    } = req.body;
    try {
      const result = await Product.findByIdAndUpdate(
        id,
        {
          name,
          price,
          discount,
          stock,
          categoryId,
          supplierId,
          description,
          mediaId,
          isDeleted,
        },
        { new: true }
      );
      console.log("◀◀◀ a ▶▶▶");
      if (result) {
        return res.send({
          code: 200,
          message: "Thành công",
          payload: result,
        });
      }
      return res.send({
        code: 400,
        message: "Thất bại",
      });
    } catch (err) {
      return res.send({ code: 400, message: "Thất bại", error: err });
    }
  },
  softDelete: async (req, res, next) => {
    const { id } = req.params;
    try {
      const result = await Product.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
      if (result) {
        return res.send({
          code: 200,
          message: "Thành công xóa",
        });
      }
      return res.send({
        code: 400,
        message: "Thất bại",
      });
    } catch (err) {
      return res.send({
        code: 400,
        message: "Thất bại",
        error: err,
      });
    }
  },
  // hardDelete: async(req,res,next)=>{
  //   const {id} =req.params;
  //   const newProductList=products.filter((item)=>item.id.toString()!==id.toString())
  //   await writeFileSync(patch,newProductList)
  //   return res.send(200, {
  //       message: "Thành công xóa",
  //     });
  // }
};
