import numpy as np
import torch

try:
  from .monotonic_align.core import maximum_path_c
except ImportError:
  maximum_path_c = None


def maximum_path_numpy(path, neg_cent, t_t_max, t_s_max, max_neg_val=-1e9):
  batch = path.shape[0]
  for i in range(batch):
    t_y = int(t_t_max[i])
    t_x = int(t_s_max[i])
    value = neg_cent[i]
    index = t_x - 1

    for y in range(t_y):
      x_from = max(0, t_x + y - t_y)
      x_to = min(t_x, y + 1)
      for x in range(x_from, x_to):
        if x == y:
          v_cur = max_neg_val
        else:
          v_cur = value[y - 1, x]

        if x == 0:
          v_prev = 0.0 if y == 0 else max_neg_val
        else:
          v_prev = value[y - 1, x - 1]

        value[y, x] += max(v_prev, v_cur)

    for y in range(t_y - 1, -1, -1):
      path[i, y, index] = 1
      if index != 0 and (index == y or value[y - 1, index] < value[y - 1, index - 1]):
        index -= 1


def maximum_path(neg_cent, mask):
  """ Cython optimized version.
  neg_cent: [b, t_t, t_s]
  mask: [b, t_t, t_s]
  """
  device = neg_cent.device
  dtype = neg_cent.dtype
  neg_cent = neg_cent.data.cpu().numpy().astype(np.float32)
  path = np.zeros(neg_cent.shape, dtype=np.int32)

  t_t_max = mask.sum(1)[:, 0].data.cpu().numpy().astype(np.int32)
  t_s_max = mask.sum(2)[:, 0].data.cpu().numpy().astype(np.int32)
  if maximum_path_c is not None:
    maximum_path_c(path, neg_cent, t_t_max, t_s_max)
  else:
    maximum_path_numpy(path, neg_cent, t_t_max, t_s_max)
  return torch.from_numpy(path).to(device=device, dtype=dtype)
