/**
 * Pagination utility functions
 */
export const paginationUtils = {
  getPaginationData: (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return {
      skip,
      take: limit,
      page,
      limit
    };
  },

  getPaginationMetadata: (total: number, page: number, limit: number) => {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }
};
