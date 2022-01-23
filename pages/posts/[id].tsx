import type { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import AddCommentForm from '../../components/AddCommentForm';
import Comment from '../../components/Comment';
import dbConnect from '../../lib/mongo';
import Post from '../../models/Post';
import Image from 'next/image';
import useAuth from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

interface Props {
  post: {
    _id: string;
    name: string;
    body: string;
    img: string;
  };
}

const PostById: NextPage<Props> = (props: Props) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState([]);
  const addComment = (comment: string, setComment: Function) => {
    if (user) {
      const userComment = {
        name: user.name,
        postId: props.post._id,
        img: user.photo,
        comment: comment,
      };
      fetch('/api/comment/add-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userComment),
      })
        .then(async () => {
          setComment('');
          setMessage('Comment Posted! Refresh to see the comment');

          setTimeout(() => {
            setMessage('');
          }, 10000);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  useEffect(() => {
    fetch(`/api/comment/${props.post._id}`)
      .then(async (res) => await res.json())
      .then((data) => setComments(data));
  }, []);
  return (
    <div>
      <Head>
        <title>Post</title>
      </Head>
      <div className='ml-2 mt-5'>
        <h1 className='text-3xl font-semibold'>{props.post.name}</h1>
        <p>{props.post.body}</p>
        <div className='flex justify-center'>
          {props.post.img !== '' && (
            <>
              <Image
                src={props.post.img}
                width={500}
                height={500}
                className='text-center'
              />
            </>
          )}
        </div>
        <div className='flex items-center flex-col mt-10'>
          <h1 className='text-3xl font-semibold'>Comments</h1>
          {message !== '' && <h3>{message}</h3>}
          <AddCommentForm handler={addComment} />
          {comments instanceof Array &&
            comments.map(
              (comment: {
                name: string;
                postId: string;
                img: string;
                comment: string;
                _id: string;
              }) => <Comment key={comment._id} comment={comment} />
            )}
        </div>
      </div>
    </div>
  );
};

export const getStaticPaths = async () => {
  await dbConnect();

  const result = await Post.find({});

  const posts = result.map((doc: any) => {
    const post = doc.toObject();
    post._id = post._id.toString();
    return { params: { id: post._id } };
  });

  return {
    paths: posts,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  await dbConnect();

  const post = await Post.findById(context.params?.id).lean();

  return {
    props: {
      post: {
        _id: post._id.toString(),
        name: post.name.toString(),
        body: post.body.toString(),
        img: post.img.toString(),
      },
    },
    revalidate: 10,
  };
};

export default PostById;