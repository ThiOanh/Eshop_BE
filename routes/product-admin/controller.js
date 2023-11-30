const { Product, Category, Supplier } = require('../../models');
const { fuzzySearch } = require('../../helper');
// const ObjectId = require('mongodb').ObjectId;

module.exports = {
  getAll: async (req, res, next) => { // NOTE

    try {
      const { page, pageSize } = req.query;

      const conditionFind = { isDeleted: false };
      const total = await Product.countDocuments(conditionFind);

      const limit = pageSize || total;
      // const skip = limit * (page - 1) || 0;
      const skip = limit * page - limit || 0;

      //page = 1, pageSize = 2, limit = 2, skip = 0
      //page = 2, pageSize = 2, limit = 2, skip = 2
      //page = 3, pageSize = 2, limit = 2, skip = 4
      //page = 4, pageSize = 2, limit = 2, skip = 6

      let results = await Product.find(conditionFind)
        .populate('category')
        .populate('supplier')
        .skip(skip)
        .limit(limit)
      // .lean();

      const numOfShow = results.length;

      return res.send(200, { total, numOfShow, page: parseInt(page || 1), pageSize: parseInt(pageSize || limit), payload: results, });
    } catch (err) {
      return res.send(404, {
        message: "Không tìm thấy",
        errors: err.message,
      });
    }
  },

  searchForOrder: async (req, res, next) => {
    try {
      const { query } = req.query;
      let conditionFind = { isDeleted: false };

      if (query) {
        const ObjectId = require('mongoose').Types.ObjectId;

        if (ObjectId.isValid(query)) {
          conditionFind = {
            ...conditionFind,
            _id: query,
          }
        } else {
          conditionFind = {
            ...conditionFind,
            name: fuzzySearch(query),
          }
        }

        // const objId = new ObjectId(!ObjectId.isValid(query) ? "123456789012" : query);

        // conditionFind = {
        //   ...conditionFind,
        //   $or: [{ _id: objId }, { name: fuzzySearch(query) }],
        // }
      }

      const result = await Product.find(conditionFind)
        .populate('category')
        .populate('supplier')
        .populate('image');

      res.send(200, {
        message: "Tìm kiếm thành công",
        payload: result,
      });
    } catch (err) {
      console.log('««««« err »»»»»', err);
      return res.send(404, {
        message: "Không tìm thấy",
        errors: err.message,
      })
    }
  },

  search: async (req, res, next) => {
    try {
      const { id, name, categoryId, priceStart, priceEnd, supplierId } = req.query;
      const conditionFind = { isDeleted: false };

      if (id) {
        conditionFind._id = id;
      };

      if (name) conditionFind.name = fuzzySearch(name);

      if (categoryId) {
        conditionFind.categoryId = categoryId;
      };

      if (supplierId) {
        conditionFind.supplierId = supplierId;
      };

      if (priceStart && priceEnd) { // 20 - 50
        const compareStart = { $lte: ['$price', parseFloat(priceEnd)] }; // '$field'
        const compareEnd = { $gte: ['$price', parseFloat(priceStart)] };
        conditionFind.$expr = { $and: [compareStart, compareEnd] };
      } else if (priceStart) {
        conditionFind.price = { $gte: parseFloat(priceStart) };
      } else if (priceEnd) {
        conditionFind.price = { $lte: parseFloat(priceEnd) };
      }

      console.log('««««« conditionFind »»»»»', conditionFind);

      const result = await Product.find(conditionFind)
        .populate('category')
        .populate('supplier');

      res.send(200, {
        message: "Tìm kiếm thành công",
        payload: result,
      });
    } catch (err) {
      console.log('««««« err »»»»»', err);
      return res.send(404, {
        message: "Không tìm thấy",
        errors: err.message,
      })
    }
  },

  largeSearch: async (req, res, next) => {
    try {
      const { name, categoryId, priceStart, priceEnd, supplierId } = req.body;
      const conditionFind = { isDeleted: false };

      if (name) conditionFind.name = fuzzySearch(name);

      if (categoryId) {
        conditionFind.categoryId = categoryId;
      };

      if (supplierId) {
        conditionFind.supplierId = supplierId;
      };

      if (priceStart && priceEnd) { // 20 - 50
        const compareStart = { $lte: ['$price', parseFloat(priceEnd)] }; // '$field'
        const compareEnd = { $gte: ['$price', parseFloat(priceStart)] };
        conditionFind.$expr = { $and: [compareStart, compareEnd] };
      } else if (priceStart) {
        conditionFind.price = { $gte: parseFloat(priceStart) };
      } else if (priceEnd) {
        conditionFind.price = { $lte: parseFloat(priceEnd) };
      }

      console.log('««««« conditionFind »»»»»', conditionFind);

      const result = await Product.find(conditionFind)
        .populate('category')
        .populate('supplier');

      res.send(200, {
        message: "Tìm kiếm thành công",
        payload: result,
      });
    } catch (err) {
      console.log('««««« err »»»»»', err);
      return res.send(404, {
        message: "Không tìm thấy",
        errors: err.message,
      })
    }
  },

  getDetail: async (req, res, next) => {
    try {
      const { id } = req.params;

      let result = await Product.findOne({
        _id: id,
        isDeleted: false,
      })
        .populate('category')
        .populate('supplier');

      if (result) {
        return res.send(200, { message: "Tìm kiếm thành công", payload: result });
      }

      return res.status(200).send({ message: `Không tìm thấy sản phẩm có ID: ${id}` });
    } catch (err) {
      res.status(500).json({
        message: 'Tìm kiếm thất bại',
        errors: err.message,
      });
    }
  },

  create: async (req, res, next) => {
    try {
      const data = req.body;

      const existSupplier = Supplier.findOne({
        _id: data.supplierId,
        isDeleted: false,
      });

      const existCategory = Category.findOne({
        _id: data.categoryId,
        isDeleted: false,
      });

      const [doExistSupplier, doExistCategory] = await Promise.all([existSupplier, existCategory]);

      const errors = [];
      if (!doExistSupplier) {
        errors.push('Nhà cung cấp không khả dụng');
      }
      if (!doExistCategory) {
        errors.push('Danh mục không khả dụng');
      }

      if (errors.length > 0) {
        return res.send(200, { message: `Thêm sản phẩm thất bại, ${errors}` })
      }

      const newRecord = new Product(data);

      let result = await newRecord.save();

      return res.send(200, {
        message: "Thêm sản phẩm thành công",
        payload: result,
      });
    } catch (err) {
      return res.send(500, {
        message: "Internal server error",
        error: err.message,
      });
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const dataUpdate = req.body;

      // // Check if the product exists and is not deleted
      // const product = await Product.findOne({ _id: id, isDeleted: false });

      // console.log('««««« product »»»»»', product);

      // if (!product) {
      //   return res.status(404).json({ message: `Không tìm thấy sản phẩm nào có ID: ${id}` });
      // }

      // // Check if the supplier exists and is not deleted
      // if (product.supplierId !== dataUpdate.supplierId) {
      //   const supplier = await Supplier.findOne({ _id: dataUpdate.supplierId, isDeleted: false });

      //   if (!supplier) {
      //     return res.status(400).json({ message: `Supplier ${dataUpdate.supplierId} không khả dụng` });
      //   }
      // }

      // // Check if the category exists and is not deleted
      // if (product.categoryId !== dataUpdate.categoryId) {
      //   const category = await Category.findOne({ _id: dataUpdate.categoryId, isDeleted: false });

      //   if (!category) {
      //     return res.status(400).json({ message: `Category ${dataUpdate.categoryId} không khả dụng` });
      //   }
      // }

      const findSupplier = Supplier.findOne({ _id: dataUpdate.supplierId, isDeleted: false });
      const findCategory = Category.findOne({ _id: dataUpdate.categoryId, isDeleted: false });

      const [doFindSupplier, doFindCategory] = await Promise.all([findSupplier, findCategory]);

      const errors = [];
      if (!doFindSupplier) {
        errors.push(' Nhà cung cấp không khả dụng');
      }
      if (!doFindCategory) {
        errors.push(' Danh mục không khả dụng');
      }

      if (errors.length > 0) {
        return res.send(200, { message: `Cập nhật sản phẩm thất bại,${errors}` })
      }

      // Update the product
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        dataUpdate,
        { new: true }
      );

      if (updatedProduct) {
        return res.status(200).json({
          message: "Cập nhật sản phẩm thành công",
          payload: updatedProduct,
        });
      }

      return res.status(404).json({ message: `Không tìm thấy sản phẩm có ID: ${id}` });
    } catch (error) {
      console.log('««««« error »»»»»', error);
      return res.send(500, {
        message: "Có lỗi",
        error,
      });
    }
  },

  softDelete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const conditionFind = {
        _id: id,
        isDeleted: false,
      }

      const result = await Product.findOneAndUpdate(
        conditionFind,
        { isDeleted: true },
        { new: true },
      );

      if (result) {
        return res.send(200, {
          message: "Xóa thành công",
          payload: result,
        });
      }

      return res.send(404, {
        message: `Không tìm thấy sản phẩm có ID: ${id}`,
      });
    } catch (err) {
      return res.send(500, {
        message: "Thất bại",
        errors: err.message,
      });
    }
  },

  restore: async (req, res, next) => {
    try {
      const { id } = req.params;

      const conditionFind = {
        _id: id,
        isDeleted: true,
      }

      const result = await Product.findOneAndUpdate(
        conditionFind,
        { isDeleted: false },
        { new: true },
      );

      if (result) {
        return res.send(200, {
          message: "Khôi phục thành công",
          payload: result,
        });
      }

      return res.send(404, {
        message: `Sản phẩm có ID: ${id} không tìm thấy hoặc đã khôi phục rồi`,
      });
    } catch (err) {
      return res.send(500, {
        message: "Thất bại",
        errors: err.message,
      });
    }
  },
};
